
# Anket (Polls) Servisinin Oluşturulması

### Polls Service'e Genel Bakış

"Poll Service" olarak adlandırılacak olan ilk sağlayıcımıza bir göz atalım. Neden bir hizmet oluşturacağız? Anket hizmeti (Poll Service), ne gelen - giden isteklerin ve yanıtların ayrıştırılmasına ne de veri varlıklarının veritabanımızda depolanmasına ve alınmasına ait olan mantığı ele alacaktır. Bu işlemler üzerinde çalışmayacaktır. Bir 'Service' genellikle, verileri depolamadan önce gelen istek üzerinde çalışmak gibi yürütmemiz gereken bazı uygulama mantığı vardır. Veya başka bir hizmete veya sağlayıcıya ulaşmamız gerektiği durumlarda kullanılır.

Geçen sefer Polls Controller'ı karşılık gelen işleyicilerle 3 uç nokta tanımladık. Oluşturma yani `create` işlevine bir göz atalım. Bu, gelen JSON gövdesini istekten çıkarır ve doğrular.

Daha sonra bu verileri oluşturacağımız anket hizmetine ileteceğiz. Bu, hizmetimizi "Enjekte edilebilir" (Injectable) veya bir sağlayıcı yapacağımız gerçeğiyle etkinleştirilecektir.

`createPoll` işlevi, diyagramda özetlenen adımları işleyecektir. Redis'te veri almak ve sürdürmek için bir Anket Deposu (Polls Repository) ile etkileşim kurmanın yanı sıra başka bir hizmet olan "JWT Hizmeti" ile çalışmak da dahil olmak üzere burada ele alınması gereken oldukça fazla mantık olduğuna dikkat edin. Bazı uygulamalarda kimlikleri o veri havuzu katmanında veya o veritabanının kendisi aracılığıyla oluşturabilirsiniz, ancak biz devam edip hizmet katmanımızda bununla ilgileneceğiz.

//TODO: Diagram will be here

Mevcut bir ankete katılmak ve yeniden katılmak için biraz benzer bir mantık ekleyeceğiz. Her şey söylenip yapıldığında, anket hizmeti, denetleyici ile sağlanan diğer hizmetler veya depolar (repos) arasındaki iş mantığını yönetmek için bir tür aracı olacaktır.

Ama şimdi devam edelim ve bu Anket Hizmetimizi (Poll Service) oluşturalım ve bunu anket modülümüze diğer modüllere ve modülümüzdeki bir sağlayıcıya erişim için "sağlayalım" (Provide)!

### Polls Service Sınıfının Oluşturulması

`polls.service.ts` dosyamızı oluşturalım. Ayrıca, türlerimiz için bir dosya oluşturalım, `type.ts`, bu, türleri hizmetlerimizde ve havuzlarımızda çeşitli işlevler için depolamak için güzel olacaktır.

`types.ts`'de, bugün yapı iskelesini oluşturacağımız 3 hizmet yöntemi için parametreleri tanımlayalım.

```ts
export type CreatePollFields = {
  topic: string;
  votesPerVoter: number;
  name: string;
};

export type JoinPollFields = {
  pollID: string;
  name: string;
};

export type RejoinPollFields = {
  pollID: string;
  userID: string;
  name: string;
};
```
Bu türler için son ek (suffix) olarak Alanları (Fields) kullanacağım, ancak bazılarının Seçenekler (Options), Parametreler (Parameters) veya Yapılandırma (Config) kullandığını görebilirsiniz. Hizmet (Service) dönüş değerleri veya nesneleri için, Sonuçlar (Results) son ekiyle benzer türler oluşturacağım.

Şimdilik sonuç veya dönüş türlerini tanımlamayacağız. Şimdilik sadece `type interface` kullanacağız!

Anket hizmeti için bir sınıf ve `polls.service.ts`'de ilk 3 yöntemimizi oluşturalım!
```ts
import { Injectable } from '@nestjs/common';
import { CreatePollFields, JoinPollFields, RejoinPollFields } from './types';

@Injectable()
export class PollsService {
  async createPoll(fields: CreatePollFields) {}

  async joinPoll(fields: JoinPollFields) {}

  async rejoinPoll(fields: RejoinPollFields) {}
}
```
Burada çok önemli olan bir şey, `PollsService`'i enjekte edilebilir (Injectable) olarak açıklamamızdır. Bir sınıfı sağlayıcı olarak bu şekilde işaretliyoruz (üzerine gelin veya tanıma bakın). Bu "Injectable" sınıfı daha sonra anketler modülümüze bir sağlayıcı olarak dahil edeceğiz.

### Poll Service için ID Oluşturucunun Tanımlanması
Bugün herhangi bir veri üzerinde ısrar etmeyeceğimiz için, kullanıcı ve anket kimlikleri oluşturmak için biraz mantık eklemek istiyorum.

Sunucunun `src` klasöründe bir `ids.ts` dosyası oluşturalım. `Nanoid` adında bir ID kütüphanesi kullanacağız. Bu paket, sunucu klasöründeki `package.json `dosyasına yüklenmiştir.

Aşağıdaki kodu ekliyoruz:

```ts
import { customAlphabet, nanoid } from 'nanoid';

export const createPollID = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  4,
);

export const createUserID = () => nanoid();
export const createNominationID = () => nanoid(8);
```
`createPollID`'nin "özel bir alfabe" kullandığını unutmayın. Bu, anketlerimiz için yalnızca büyük harf ve rakamlardan oluşan 4 karakterli bir kimlik oluşturmamızı sağlar. Bunun nedeni, oyun için arkadaşlar arasında kolayca paylaşılabilecek veya geçilebilecek bir kimlik oluşturmak istememizdir.

Kullanıcı kimliğimiz (userID), varsayılan uzunluğu 21 karakter olan standart bir `nanoid` olacaktır. Seçenecek/ opsiyon kimliği (`nominationID`) projede daha sonra kullanılacak, ancak sanırım onu ​​şimdi eklesek iyi olur.

Bununla artık servis metotlarında ID'ler oluşturalım.
```ts
import { Injectable } from '@nestjs/common';
import { createPollID, createUserID } from 'src/ids';
import { CreatePollFields, JoinPollFields, RejoinPollFields } from './types';

@Injectable()
export class PollsService {
  async createPoll(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();

    return {
      ...fields,
      userID,
      pollID,
    };
  }

  async joinPoll(fields: JoinPollFields) {
    const userID = createUserID();

    return {
      ...fields,
      userID,
    };
  }

  async rejoinPoll(fields: RejoinPollFields) {
    return fields;
  }
}
```
`createPoll`'da hem bir oyun kimliği (`gameID`) hem de bir kullanıcı kimliği (`userID`) oluşturmamız gerekiyor. Sonraki kısımlarda bu kimlikleri nerede sakladığımız ve bunları nasıl kullandığımızla ilgili ayrıntılara gireceğiz.

`joinPoll`'da, müşteri aslında katılmaya çalıştıkları anket için `pollID`'yi sağlayacağından, yalnızca bir kullanıcı kimliği oluşturacağız. Bunu `JoinPollsField` türünü kendimize hatırlatarak görebiliriz.

Bu, kullanıcının tarayıcısından gelen yetkilendirme verilerinden geleceğinden, şimdilik bir ankete yeniden katılmakla ilgili hiçbir şey yapmayacağız.

### Polls Controller'ından Polls Service Insider'ına Erişim
Şimdi anketler modülümüzün içindeki diğer sınıflar için anket hizmetimizi erişilebilir hale getirelim. Bunu `polls.module.ts`'nin `Module` dekoratöründe sağlayıcı olarak kaydederek yapıyoruz.
```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';

@Module({
  imports: [ConfigModule],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}
```
Şimdi denetleyicide enjekte edilen (injected) veya sağlanan hizmetimize nasıl eriştiğimizi göstermek istiyorum. İlk olarak, `polls.controller.ts`'nin yapıcısına hizmeti ekliyoruz.

```ts
import { PollsService } from './polls.service';

@Controller('polls')
export class PollsController {
  constructor(private pollsService: PollsService) {}
  
  // rest of code
}
```
Ve servise erişmek için yöntemlerimizi güncelleyelim. Son kez eklediğimiz log ifadesini kaldıracağız ve hizmet yöntemlerimizi çağırmanın sonucunu döndüreceğiz.
```ts
  @Post()
  async create(@Body() createPollDto: CreatePollDto) {
    const result = await this.pollsService.createPoll(createPollDto);

    return result;
  }

  @Post('/join')
  async join(@Body() joinPollDto: JoinPollDto) {
    const result = await this.pollsService.joinPoll(joinPollDto);

    return result;
  }

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
`createPoll` ve `joinPoll` durumunda, bu `DTO`'ları yalnızca yöntemlerin beklediği türe uydukları için geçirebileceğimize dikkat edin.

`rejoinPoll` için verileri bir belirteçten (`token`) çıkaracağız. Şimdilik, onu bazı yapay verilerle dolduracağız.

Ayrıca, `Logger`'ı içe aktarmalardan kaldırdığınızdan emin olun.
