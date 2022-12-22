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

```ts
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

```ts
const app = await NestFactory.create(AppModule);
```

#### `Exports (Dışarı Aktarma/Çıkarma)`:

Şimdi dışarı aktarmadan bahsedelim. Bunu daha sonra göreceğiz, ancak bu, oluşturduğumuz bir modülün hangi hizmetlerinin veya sağlayıcılarının harici olarak kullanılabilir hale getirilmesi gerektiğini tanımlamamıza izin veriyor. Daha sonra, diğer modüllerin veya hizmetlerin kullanabileceği bir redis istemcisini dışa aktardığımız bir `RedisModule` oluşturacağız.

#### `Controllers (Kontrolcü/Denetleyici)`:

Denetleyiciler, istemcilerden gelen istekleri ve istemcilere giden yanıtları işlemek için kullanılır. REST API'miz söz konusu olduğunda, denetleyici, istek gövdelerinin yazılan veri yapısına ayrıştırılması ve giden yanıtlar için yazılan veri yapılarının seri hale getirilmesiyle birlikte yolları ve istek yöntemlerini tanımlayacaktır.

### Polls (Anket) Modülünün Oluşturulması

... will continue


