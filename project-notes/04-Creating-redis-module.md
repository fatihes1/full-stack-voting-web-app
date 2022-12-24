# Redis Modülünün Oluşturulması

Son kısımda, bir anket oluşturmak ve ankete katılmak için uygulama mantığını yönetmeye yönelik bir hizmet (service) oluşturmayı gördük. Ayrıca, denetleyicimizin (controller) bu hizmetteki yöntemleri çağırabilmesi için bu hizmeti bir sağlayıcı (provider) olarak anketler modülüne nasıl enjekte (inject) edeceğimizi de inceledik.
![3-module](https://user-images.githubusercontent.com/54971670/209447520-fee82dbd-2b7d-4a33-a63a-79a842077193.PNG)

### Modüllere Genel Bakış

[Dokümantasyon üzerinden inceleyebilirsiniz.](https://docs.nestjs.com/modules)

Bir modülün, NestJS'nin önerilen düzenleme ve uygulama özellikleri yöntemi olduğunu hatırlayın. Anket modülümüze (Polls Module) bakarsak, `@Module` dekoratöründe birkaç özelliğimiz olduğunu görürüz. `imports` dizisi, diğer modüllerin özelliklerini modülümüze aktarmamızı sağlar. Bu örnekte, yapılandırma dosyalarına (`.env`) ve ortam değişkenlerine erişmek için NestJS tarafından sağlanan bir modül olan `ConfigModule`'ü içe aktarıyoruz. Ayrıca, son not dosyasında üzerinde çalıştığımız sağlayıcılar (`providers`) ve denetleyiciler (`controller`) de var.

Ancak bu modülde yer almayan bir alan daha vardır ki o da dışarı aktarma olan `exports` alanıdır. Bu, diğer modüller tarafından tüketilecek yani kullanılacak bir modül oluştururken çok önemli bir alandır, çünkü bu diğer modüllerin neye erişebileceğini belirler.

Yapmak istediğimiz, konfigürasyona dayalı olarak bazı özellikleri dışa aktaran bir modül oluşturmanın bir yolunu bulmak. Bizim durumumuzda bu, Redis'e nasıl bağlanılacağına ilişkin yapılandırma olacaktır. `app.module.ts` dosyamıza bakarsak, `ConfigModule`'de modülü başlatmak için `forRoot` adlı bir tür `factory` olduğunu görürüz. Modül bu şekilde başlatılır ve ortam değişkenlerini yükler.

`Redis` söz konusu olduğunda, Redis istemcimizi onu kullanan modüller için kullanılabilir hale getirmeden önce Redis'e bağlandığımızdan emin olmak istiyoruz. Bu, senkronize `forRoot` yönteminden biraz farklıdır. Ayrıca, daha önce örneği oluşturulmuş `ConfigService`'e erişmek isteyeceğiz.

Bunu nasıl yapabileceğimize güzel bir örnek [NestJS JWT Modülüdür](https://github.com/nestjs/jwt#async-options). 1. durumdaki kalıbı bir `useFactory` ile çoğaltacağız. `Import` dizimizde mevcut bir `ConfigModule`'ü kabul edeceğiz ve kullanıma sunulan sonuç `ConfigService`'i enjekte (`inject`) edeceğiz. `useFactory`, Redis yapılandırmamız için ortam değişkenlerini yüklemeyi işleyecek zaman uyumsuz bir geri arama olacaktır.

Şimdi bu parametrelerle gerçekte ne yaptığımızı görmek için modülümüzü benzer bir konfigürasyonla oluşturmaya geçelim.

### Redis Modülünün Tanımlanması

Sunucu kaynak klasörümüzün kök dizininde `redis.module.ts` oluşturalım. İçeride, bu modülün yapısını oluşturalım.

```ts
import { DynamicModule } from "@nestjs/common";
import { Module } from "@nestjs/common";
import IORedis from "ioredis";

@Module({})
export class RedisModule {
  static async registerAsync(): Promise<DynamicModule> {
    return {
      module: RedisModule,
      imports: [],
      providers: [],
      exports: [],
    };
  }
}
```

`@Module` decoratör ile modülü tanımlıyoruz ve bir `DynamicModule` döndürecek bir `registerAsync` metodu tanımlıyoruz. Bir `DynamicModule` temel olarak bir modül için gerekli alanlara sahip bir nesnedir. Redis istemcisini oluşturmak için kullanacağımız kitaplık olan `IORedis` de dahil olmak üzere içe aktarmalarımızı da eklemeye başlayacağız.

Şimdi, bu modül için, JWT modülünde gördüklerimizle eşleşen bazı yapılandırma seçeneklerini tanımlamayalım. Bu biraz karmaşık, bu yüzden gerekirse yer yer geri dönüp JWT yapılandırmasına bakabiliriz.

```ts
import { DynamicModule, FactoryProvider, ModuleMetadata } from '@nestjs/common';
import { Module } from '@nestjs/common';
import IORedis, { Redis, RedisOptions } from 'ioredis';

type RedisModuleOptions = {
  connectionOptions: RedisOptions;
  onClientReady?: (client: Redis) => void;
};

type RedisAsyncModuleOptions = {
  useFactory: (
    ...args: any[]
  ) => Promise<RedisModuleOptions> | RedisModuleOptions;
} & Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider, 'inject'>;

@Module({})
export class RedisModule {
  static async registerAsync({
    useFactory,
    imports,
    inject,
  }: RedisAsyncModuleOptions): Promise<DynamicModule> {
```

Oluşturduğumuz ilk tip (type) `RedisModuleOptions`. Bu, bir `RedisClient` örneğini başlatma seçeneklerini içerecektir. Bu tür tanımı `IORedis` tarafından sağlanmaktadır. İkinci seçenek ise client hazır olduğunda isteğe bağlı olarak çağırabileceğimiz bir fonksiyondur. Bunu soru işareti ile isteğe bağlı yapıyoru<, `?.` Bu, Redis'in hazır olduğunu loglamak için kullanabileceğimiz bir işlevdir veya belki de ihtiyaç duyacağımız Redis'e bağlı başka bir mantık vardır.

`RedisAsyncModuleOptions` türü, `registerAsync`'e geçireceğimiz parametreleri tanımlar.

Bu tür (`type`), `useFactory` yöntemini tanımlar (JWT modülüne tekrar bakabilirsiniz). Bu işleve çağrıldığı yerden iletilen argümanları gerçekten umursamıyoruz. Tek umursadığımız, `RedisConnectionOptions`'ımızı ve belki de bir `onClientReady` geri aramasını döndürmesidir.

### registerAsync'i tanımlanması

İlk olarak, içe aktarmaları alacağız ve geri döndüreceğimiz `DynamicModule`'a ileteceğiz.

```ts
return {
  module: RedisModule,
  imports: imports,
  providers: [],
  exports: [],
};
```

Ardından, sağlayıcılar `providers` dizisinde geri dönmek için dinamik olarak oluşturulmuş modülümüzü tanımlayacağız.

```ts
export const IORedisKey = "IORedis";

// omitted content

const redisProvider = {
  provide: IORedisKey,
  useFactory: async (...args) => {
    const { connectionOptions, onClientReady } = await useFactory(...args);

    const client = await new IORedis(connectionOptions);

    onClientReady(client);

    return client;
  },
  inject,
};

return {
  module: RedisModule,
  imports,
  providers: [redisProvider],
  exports: [redisProvider],
};
```

`RedisProvider`'ımız, dinamik olarak oluşturulmuş bir sağlayıcı şeklini alacaktır. Provide alanına, modülü enjekte etmek istediğimiz yere yerleştirmek için kullanılabilecek bir anahtar verebiliriz. Bunu daha sonra Redis'ten veri oluşturmak ve almak için bir depo katmanı (`repository layer`) oluşturduğumuzda göreceğiz.

Inject alanında, parametrede sağlanan her şeyi iletiriz, bu bizim durumumuzda `ConfigService` olur. Bu, modülün `ConfigService`'e erişimini sağlayacaktır. Bunun nedeni, daha sonra oluşturacağımız `PollsRepository`'deki bazı ortam değişkenlerine de erişmemiz gerekmesidir.

`useFactory` yöntemi (döndürülen nesnedeki), sağlayıcılar için özel bir alandır ve NestJS'ye modülümüz hazır olmadan önce eşzamansız verileri çözmemiz gerektiğini belirtir.

İçinde, herhangi bir argüman içerebilen, ancak IORedis `RedisOptions` ve belki de bir `onClientReady` döndürmek zorunda kalan, aktardığımız diğer `useFactory` yöntemini çağırıyoruz.

Daha sonra `IORedis` istemcimizi (`client`) yaratıyoruz, geri aramayı yürütüyoruz (bunu biraz sonra göreceğiz) ve istemciyi geri döndürüyoruz.

### Modülün Oluşturulması

Şimdi bu modülün dinamik bir konfigürasyonunu oluşturacağız. Bunu yapmak için `modules.config.ts` adında bir dosya oluşturacağız. Ben sadece buna, çünkü bu modülü yapılandırmak için `polls.module.ts`'ye dahil etmeyi tercih etmeyeceğim epeyce kod var.

Öncelikle kurulum için ihtiyaç duyacağımız düğüm modüllerini veya `RedisModule`'ü içe aktaracağım.

```ts
import { Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "./redis.module";
```

Redis'e bağladığımızın log kaydını tutmaya yardımcı olacak ilk özel `Logger` oluşturacağız.

Modülümüzü yüklemek için `registerAsync` kullanacağımızı unutmayın.

```ts
export const redisModule = RedisModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const logger = new Logger("RedisModule");

    return {
      connectionOptions: {
        host: configService.get("REDIS_HOST"),
        port: configService.get("REDIS_PORT"),
      },
      onClientReady: (client) => {
        logger.log("Redis client ready");

        client.on("error", (err) => {
          logger.error("Redis Client Error: ", err);
        });

        client.on("connect", () => {
          logger.log(
            `Connected to redis on ${client.options.host}:${client.options.port}`
          );
        });
      },
    };
  },
  inject: [ConfigService],
});
```

İlk olarak, `ConfigModule`'ü içe aktardığımızdan emin oluyoruz ve ardından, temelde bu `ConfigService`'i `RedisModule`'a ileten enjekte ediyoruz.

Aslında `registerAsync`'imizde çağrılan `useFactory`'de, daha önce `.env`'de tanımladığımız bazı ortam değişkenlerine dayalı olarak bağlantı seçeneklerini döndürürüz. Eşzamansız kayıtta bu yapılandırma, `onClientReady` geri aramasında erişebileceğimiz istemciyi oluşturmak için kullanılacaktır.

Bu istemciyi bazı log kayıtları için kullanıyoruz. İlk olarak, herhangi bir hata olup olmadığını loglayacağız. Kaydedicinin en üstünde `RedisModule` dizesiyle bir kaydedici tanımladığımıza dikkat edin. Uygulamamızı başlattığımızda bu log kayıtlarını açıkça görebileceğiz!

### Anketler Modülünde Modülü Kaydetme ve Test Etme

Az önce oluşturduğumuz lowercase `redisModule`'umuzu `PollsModule`'umuza sağlayalım.

```ts
import { redisModule } from "src/modules.config";

// content omitted

@Module({
  imports: [ConfigModule, redisModule],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}
```

Uygulamayı başlatmak için kök klasöre gidin. Makinenizde docker'ın önyüklendiğinden emin olun ve `npm run start`'ı çalıştırın.

Proje kök dizinindeki `docker-compose.yml` dosyamızda Docker'da çalışacak şekilde ayarlanmış redis'imiz olduğunu unutmayın.

Log kayıtlarına bakarsanız, Redis için oluşturduğumuz birkaç satır log kaydı göreceğiz.

```bash
LOG [RedisModule] Redis client ready
LOG [RedisModule] Connected to redis on localhost:6379
```
