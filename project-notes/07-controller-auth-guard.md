# Controller Kimlik Doğrulama Koruması (Auth Guard)

### Mevcut Uç Noktalara Genel Bakış

Şimdi `polls.controller.ts`'deki mevcut uç noktalarımızı gözden geçirelim.

`@Controller` dekoratöründe, bu özelliğin temel yolunu (`path`), yani anketin uç noktalarını bildiririz. Mevcut haliyle, oluşturma (`create`) ve katılma (`join`) işleyicilerimiz veya yöntemlerimiz çalışıyor. `CreatePollResponse` ve `JoinPollResponse`'u döndürürler. Bu yanıtlar, geçen sefer eklediğimiz bir JWT'yi içerir.

Bir ankete yeniden katılmak için 3. bir uç noktamız olduğuna dikkat edin. Bu hangi amaca hizmet ediyor?

Tarayıcısını veya sekmesini kapatmış olabilecek bir kullanıcının yeniden bir ankete girmesine ve anketin mevcut durumunu almasına izin verecek. Bunun kullanıcının yeni kullanıcı bilgisi girmesine gerek kalmadan gerçekleşmesini istiyoruz. Ayrıca, daha önce katıldıkları aynı ankete geri atanmalarını sağlamak istiyoruz.

Bunu, anket oluştururken veya ankete katılırken kullanıcının orijinal olarak aldığı JWT'yi göndererek yapabiliriz!

NestJS, koruma (`guards`) denilen bir şeyle bunu yapmamız için bir yol sağlar.

Nasıl bir tane oluşturabileceğimizi görelim ve ardından onu bir kullanıcı için JWT bilgilerini çıkarmak için kullanalım!

### Controller AuthGuard'ın Oluşturulması

Anketle ilgili bilgileri özel olarak çıkaracağımız için bu korumayı anketler klasörümüzün içine ekleyeceğiz. Ancak, bu korumayı ve JWT modülünü uygulama düzeyinde koymak için bir argüman görebiliyorum, bunu tercih ederseniz yapabilirsiniz!

`controller-auth.guard.ts`'de aşağıdaki gibi bir koruma başlatacağız.

```ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Logger } from "@nestjs/common";

@Injectable()
export class ControllerAuthGuard implements CanActivate {
  private readonly logger = new Logger(ControllerAuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}
}
```

Bir koruma oluşturmak için `CanActivate` arabirimini (interface) uygulayan enjekte edilebilir bir sınıf oluşturmamız gerekir. Sınıfı `ctrl + sol tık` yaparsak, `CanActivate` arayüzünü uygulamak için gerekli yöntemi VS koduna ve typescript'e ekleyebiliriz. `CanActivate`'i uygulayan bir sınıf da koruma olarak kullanılabilir.

```ts
@Injectable()
export class ControllerAuthGuard implements CanActivate {
  private readonly logger = new Logger(ControllerAuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    throw new Error("Method not implemented.");
  }
}
```

Bu yöntem bir `boolean` veya `Promise` veya `Observable sarılmış boolean` döndürmeli ve istemciye belirli bir denetleyici yöntemine erişim izni vererek devam edebileceğinizi söylemelidir, bu bizim durumumuzda yeniden katılma yani `rejoin` olacaktır. `contex: ExecutionContext`, gelen isteğin bilgilerini almamızı sağlar. Bu durumda, HTTP isteğinin gövdesini nasıl alacağımızı göreceğiz.

```ts
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    this.logger.debug(`Checking for auth token on request body`, request.body);

    return false;
  }
```

Bu korumaya bir `HTTP` isteği ile çalışacağını söylemek için `context.switchToHttp()` kullanıyoruz. Ayrıca daha sonra yapacağımız bir `websocket` bağlamına da geçebiliriz. Şimdilik `false` döndüreceğiz, bu da müşterinin bu korumayı her zaman başarısız olacağı anlamına gelir.

JWT erişim belirtecini alması gereken gelen istek gövdemizin beklenen şeklini tanımlamak için küçük bir yardımcı program türü ekleyelim. Bunu `polls types.ts`'de yapacağız.

```ts
import { Request } from "express";
// ... content omitted

// guard types
type AuthPayload = {
  userID: string;
  pollID: string;
  name: string;
};

export type RequestWithAuth = Request & AuthPayload;
```

İsteği tanımlamak için, `NestJS`'nin bu başlık altında `Express` kullandığını bilmemiz gerekiyor. Ancak, bu şekilde yapılandırırsanız `Fastify` kullanıyor olabilir. Daha sonra bunu bir `AuthPayload` ile kesiştiriyoruz. Gelen istek aslında bu türlere sahip olmayacak, ancak istek nesnesini `JWT`'den çıkaracağımız bilgi olan bu bilgiyle mutasyona uğratmak istiyoruz.

İlk olarak, isteğe bir tür `const request` vereceğiz: `RequestWithAuth = context.switchToHttp().getRequest();`

Ardından, `accessToken`'ı alıp geçerli olduğunu doğrulayalım.

```ts
const { accessToken } = request.body;

if (!accessToken) {
  throw new ForbiddenException("No authorization token provided");
}

this.logger.debug(`Validating auth token: ${accessToken}`);

// validate JWT Token
try {
  const payload = this.jwtService.verify(accessToken);
  // append user and poll to socket
  request.userID = payload.sub;
  request.pollID = payload.pollID;
  request.name = payload.name;
  return true;
} catch {
  throw new ForbiddenException("Invalid authorization token");
}
```

API'miz, `accessToken`'ın istek gövdesinin `JSON`'unun bir parçası olmasını bekleyecektir, ancak bunun bir başlıkta (`headers`) da gönderilebilmesi yaygın bir durumdur.

Daha sonra jetonumuzun değiştirilip değiştirilmediğini ve süresinin dolmadığını kontrol eden `jwtService.verify` yöntemini kullanırız. Süresi dolmuşsa, bu yöntem bir hata atar. Bu hatayı yakalayacağız ve ardından `NestJS` tarafından sağlanan yerleşik bir hata oluşturacağız. Bu, aslında kullanıcıya bir 403 hatası göndereceğiz.

Bir hata yoksa, yük, kodu çözülmüş JWT belirteci olacaktır. Bu verileri, denetleyicilerimizin ve hizmetlerimizin kullanabileceği talebimize ekleyeceğiz!

### Guard'ın Kullanılması

Korumaları (`Guards`) uygulamak için `polls.controller.ts` dosyasını açalım. NestJS tarafından sağlanan bir `UseGuard` dekoratör aracılığıyla ekliyoruz.

```ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ControllerAuthGuard } from './controller-auth.guard';
// ... content omitted

  @UseGuards(ControllerAuthGuard)
  @Post('/rejoin')
  async rejoin() {
    const result = await this.pollsService.rejoinPoll({
      name: 'From token',
      pollID: 'Also from token',
      userID: 'Guess where this comes from?',
    });

    return result;
  }
```

Ardından, artık NestJS'nin yerleşik `@Req`'ini kullanarak gelen isteği ayıklayabiliriz. Artık bu talebin az önce `type.ts`'de tanımladığımız şekle sahip olacağını bildiğimizi hatırlayın.

```ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
// omitted content
import { RequestWithAuth } from './types';

// omitted content

  @UseGuards(ControllerAuthGuard)
  @Post('/rejoin')
  async rejoin(@Req() request: RequestWithAuth) {
    const result = await this.pollsService.rejoinPoll({
      name: 'From token',
      pollID: 'Also from token',
      userID: 'Guess where this comes from?',
    });

    return result;
  }
```

`AuthGuard`'ın `canActivate` yöntemi başarısız olursa veya bizim durumumuzda bir `ForbiddenException` atarsa, NestJS'nin hata filtresi (`exception filter`) olarak adlandırılan varsayılan hata işlemesi, 403 hatasıyla yanıt verir. Bunu daha sonra göstereceğiz. Geçerse, `requestWithAuth` türünde tanımlandığı gibi, isteğimizin kullanıcı bilgilerine ve anket bilgilerine sahip olacağını biliyoruz.

Ankete yeniden katılma isteğinden kullanıcı bilgilerini çıkaralım!

```ts
async rejoin(@Req() request: RequestWithAuth) {
    const { userID, pollID, name } = request;
    const rejoinPollResponse = await this.pollsService.rejoinPoll({
      userID,
      pollID,
      name,
    });

    return {
      poll: rejoinPollResponse,
    };
  }
```

`rejoinPoll` yöntemimizi zaten tanımladığımızı hatırlayın. Orada neler olduğunu hatırlamak için bir göz atalım. Bu yöntem daha sonra katılımcıyı anket havuzuna ekler. `WebSockets` ile çalışmaya başladığımızda katılımcının nasıl kaldırıldığını göreceğiz.
