# Rest API'ın Oluşturulması

Notun bu kısmında, anket oluşturmak, ankete katılmak ve kullanıcının tarayıcısını yanlışlıkla kapatması durumunda ankete yeniden katılmak için gelen istekleri işlemek üzere `NestJS`'yi nasıl yapılandıracağımızı öğreneceğiz.

Bir veritabanında anket (`Poll`) oluşturmanın tüm ayrıntılarını açıklamayacağız, ancak uç noktaları (End-points) olan bir `Poll Controller`ın nasıl oluşturulacağını öğreneceğiz.

### Modüllere Genel Bakış

Uç noktalarımızı oluşturmadan önce, NestJS'de modül'ün ne olduğuna değineceğiz. NestJS, bir uygulamayı ilgili özelliklere göre gruplandırmak için  modülleri kullanmamızı önerir.

Uygulamamızda temelde tek bir özelliğimiz var, o da:  anketleri yönetme özelliği. Anket derken oylanacak konuyu kastediyorum. Uygulamamızı `Redis` ve `JSON` web belirteçleriyle çalışacak şekilde yapılandırmak için daha sonra birkaç modül daha oluşturacağız, ancak ana özelliklerin bulunduğu modülümüz anketlerle çalışmak için kullanılacak.

`main.ts` dosyasına bakarsak, `NestFactory.create `işlevi aracılığıyla kök `AppModule` ile bir uygulama oluşturduğumuzu göreceksiniz. İkinci argüman aracılığıyla uygulama oluşturma yapılandırması da sağlıyoruz. Bu durumda, sunucumuzu yalnızca daha sonra oluşturacağımız istemci uygulamasının bağlantı noktasından istek alacak şekilde yapılandırıyoruz.

`AppModule` (`server/src/app.module.ts`), dosyasına bakarsak `@Module` decorator'ünü görürüz. Bu decorator bize modülün `imports`, `providers` ve `exports` gibi değerlere sahip olacağını gösterir.

Çok fazla ayrıntıya girmeden ve zaten sahip olduklarımdan daha fazla bahsetmeden, kısaca bunların ne olduğuna bakalım.

#### `Provider (Sağlayıcı)`:

Sağlayıcı, uygulamanıza bir tür işlevsellik sağlamanın bir yoludur. Bu kulağa belirsiz geliyorsa, çünkü öyle bir şey! Genellikle, bir modüle hizmetler veya uygulama mantığı sağlamanın bir yoludur. Uygulamamızda, Rest API'miz ve veritabanımız arasındaki uygulama mantığını yöneten bir anket hizmeti (`Poll Service`) sağlayacağız.

#### `Imports (İçe Aktarma)`:

İçe aktarma, oluşturmuş olabileceğiniz veya bazı kitaplıklarda bulunan bir modülün özelliklerini getirmenin bir yolunu sağlar. [Uygulama Modülümüze](AppModule) tekrar baktığımızda, bir `ConfigModule` içe aktardığımıza dikkat edin. Bu, NestJS tarafından sağlanan bir modüldür. Sağlanan bir `factory` ile bu modülü başlatıyoruz. Bu `factory`, kök dizininde bir `.env` dosyası arayacaktır.

Bu `ConfigModule`'ü içeri aktardığımız için, onu uygulamamız boyunca ortam değişkenlerine erişmek için kullanabiliriz.

`main.ts` içindeki `app.get(ConfigService)` ile `Config`'e bir modülün dışından bile erişebileceğimize dikkat edin.

Şimdi `CORS` için yeni bir ortam değişkeni eklemeyi denemek istiyorum. CORS portumuzu sabit kodladığımıza dikkat edin. Öncelikle bunu `.env `dosyamıza ekleyelim.

```
PORT=3000
CLIENT_PORT=8080
REDIS_HOST=localhost
```
Ardından, CORS'u dinamik olarak yapılandırmak için uygulamada özel bir yöntem çağıracağız.

```
  const configService = app.get(ConfigService);
  const port = parseInt(configService.get('PORT'));
  const clientPort = parseInt(configService.get('CLIENT_PORT'));

  app.enableCors({
    origin: [
      `http://localhost:${clientPort}`,
      new RegExp(`/^http:\/\/192\.168\.1\.([1-9]|[1-9]\d):${clientPort}$/`),
    ],
  });

  await app.listen(port);
```
İkinci olası kaynağı, `clientPort` için dize enterpolasyonu kullanmamıza izin veren bir `RegExp` yapıcısının içine sardığımıza dikkat edin.

Daha sonra uygulama factory'sinde `cors` yapılandırmasını temizliyoruz.

```
const app = await NestFactory.create(AppModule);
```

#### `Exports (Dışarı Aktarma/Çıkarma)`:

Şimdi dışarı aktarmadan bahsedelim. Bunu daha sonra göreceğiz, ancak bu, oluşturduğumuz bir modülün hangi hizmetlerinin veya sağlayıcılarının harici olarak kullanılabilir hale getirilmesi gerektiğini tanımlamamıza izin veriyor. Daha sonra, diğer modüllerin veya hizmetlerin kullanabileceği bir redis istemcisini dışa aktardığımız bir `RedisModule` oluşturacağız.

#### `Controllers (Kontrolcü/Denetleyici)`:

Denetleyiciler, istemcilerden gelen istekleri ve istemcilere giden yanıtları işlemek için kullanılır. REST API'miz söz konusu olduğunda, denetleyici, istek gövdelerinin yazılan veri yapısına ayrıştırılması ve giden yanıtlar için yazılan veri yapılarının seri hale getirilmesiyle birlikte yolları ve istek yöntemlerini tanımlayacaktır.

### Polls (Anket) Modülünün Oluşturulması

`PollsModule`'umuzu oluşturalım. Bunu yapmak için, "`anket`" (poll) işlevimizi gruplandırmak için yeni bir klasör ekleyelim. İçinde bir `polls.module.ts` dosyası oluşturacağız.

`Module` dekoratörünü en üstteki `@nestjs`'den içe aktarmamız gerekecek.

```ts
import { Module } from '@nestjs/common';
```
Bu ekleme işleminden sonra, daha önce bahsedilen `ConfigModule`'ü de içe aktarıyoruz.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
```
İçeri aktarma işlemlerinden hemen sonra `PollsModule` sınıfını oluştururuz.

```ts
@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [],
})
export class PollsModule {}
```
Bu modül boyunca ortam değişkenimize erişebilmek isteyeceğimizden, `ConfigModule`'ü içe aktardığımıza eklediğimize dikkat edin. Bu modüle nasıl erişebileceğimizi daha sonra göreceğiz.

Artık bir Anketler (Polls) modülümüz olduğuna göre, uygulamanın bunu bilmesine ihtiyacımız var. Bu nedenle, bu modülü içe aktarıp `app.module.ts` dosyasına kaydedeceğiz.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PollsModule } from './polls/polls.module';

@Module({
  imports: [ConfigModule.forRoot(), PollsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```
Şimdi projemizi sunucuyu ayağa kaldırmak için gerekli olacak olan `nest start --watch` komutunu çalıştıracağız. `docker`'ın çalıştığından emin olduktan sonra `package.json` dosyasının içinde tanımlı olan betiklerden `npm run start`'ı proje kök dizininde çalıştıralım.

### Polls Controller ve Uç Noktaların Tanımlanması

Artık nihayet bir denetleyici oluşturmaya hazırız. Bunu bir `polls.controller.ts` dosyası oluşturarak yapıyoruz.

Bu sınıf tabanlı çerçevelerde sık sık yapacağımız gibi, bu anket denetleyicisi için bir sınıf oluşturalım. Bu denetleyiciyi `Nest`'in yerleşik `@Controller` dekoratörüyle süsleyeceğiz.

```ts
import { Controller, Logger, Post, Body } from '@nestjs/common';

@Controller('polls')
export class PollsController {
  // TODO - add constructor for access to providers!
}
```
Ardından, bir anket oluşturmak, katılmak ve yeniden katılmak için rotaları/yönlendirmeleri (route) tanımlayacağız. Bunu class içerisinde dekore edilmiş bir method ile aşağıdaki gibi yapıyoruz.

```ts
@Controller('polls')
export class PollsController {
  // TODO - add constructor for access to providers!

  @Post()
  async create() {
    Logger.log('In create!');
  }

  @Post('/join')
  async join() {
    Logger.log('In join!');
  }

  @Post('/rejoin')
  async rejoin() {
    Logger.log('In rejoin!');
  }
}
```
Bu, `POST` isteklerini `localhost:8080/polls`, `localhost:8080/polls/join` ve `localhost:8080/polls/rejoin` adreslerine göndermemize izin verecektir.

*Bunları Postman'da test edebilirsiniz.*

### Uç Noktalar İçin İstek Verisi (Body) Tanımlama
Ancak müşteriden gelen herhangi bir veriyi gerçekten nasıl yakalayabiliriz? `NestJS` bunun için de bize güzel bir dekoratör sağlamıştır.

Bu dekoratörleri kullanmak için, önce istek gövdesinde ne beklediğimizi tanımlayacak bazı TypeScript türleri, bu durumda sınıflar oluşturacağız.

Türlerimizi (Type) saklayacak bir `dtos.ts` dosyası oluşturacağız.
```ts
import { Length, IsInt, IsString, Min, Max } from 'class-validator';

export class CreatePollDto {
  @IsString()
  @Length(1, 100)
  topic: string;

  @IsInt()
  @Min(1)
  @Max(5)
  votesPerVoter: number;

  @IsString()
  @Length(1, 25)
  name: string;
}

export class JoinPollDto {
  @IsString()
  @Length(6, 6)
  pollID: string;

  @IsString()
  @Length(1, 18)
  name: string;
}
```
Bu kodda, gelen verileri doğrulamaya (validation) da yarayan sınıflar ekliyoruz.

Örneğin, `votesPerVotes` bir tam sayı-integer (veya bir tamsayıya ayrıştıran bir dize- string) olmalıdır. Sınıf alanlarımızı doğrulamak için `class-validator` paketindeki yardımcı programları kullanabiliriz.

Birazdan değineceğimiz `Rejoin` anketi için bir request body tanımı oluşturmayacağız.

Poll Controller'a geri döndüğümüzde, sınıflarımızı bu gövde tanımlarını kullanacak şekilde güncelleyeceğiz.

````ts
@Controller('polls')
export class PollsController {
  // TODO - add constructor for access to providers!

  @Post()
  async create(@Body() createPollDto: CreatePollDto) {
    Logger.log('In create!');

    return createPollDto;
  }

  @Post('/join')
  async join(@Body() joinPollDto: JoinPollDto) {
    Logger.log('In join!');

    return joinPollDto;
  }

  @Post('/rejoin')
  async rejoin() {
    Logger.log('In rejoin!');
    // @TODO - add implementation for extracting user from token

    return {
      message: 'rejoin endpoint',
    };
  }
}
```

### Controller'ın Modüle Tanıtılması

Bu şey işe yaramadan önce halletmemiz gereken küçük bir adım var. O da `polls.module.ts` içine kaydetmek için;

```ts
import { PollsController } from './polls.controller';

@Module({
  imports: [ConfigModule],
  controllers: [PollsController],
  providers: [],
})
export class PollsModule {}
```