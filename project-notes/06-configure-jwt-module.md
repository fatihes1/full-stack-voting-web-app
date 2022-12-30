# JWT Modülünün Yapılandırılması

Aşağıdaki şemaya bakarak, JWT modülünü yapılandıracağız. Bu, Anketler modülümüze (PollsModule) bir sağlayıcı (provider) olarak enjekte edilecektir. Bu, `PollsModule` içindeki sınıflarda `node-jsonwebtoken`'ın işlevselliğine erişmemizi sağlayacaktır.

Bugün bu JWT'leri kullanacağımız ana yer Anket Hizmeti'dir. Bir kullanıcı bir anket oluşturduğunda veya bir ankete katıldığında, kullanıcı bilgileriyle birlikte katıldıkları anket hakkında bir JWT bilgisi döndürürüz. Bu, katıldıkları belirli anketi ve yalnızca o anketi güncellemelerine izin verecektir.

Daha sonra, bir istemciyi veya kullanıcının JWT'sini kontrol eden ve hangi anketi güncellediklerini belirleyen "yetkilendirme görevlileri" (authorization guards) yaratacağız.

![4-jwt](https://user-images.githubusercontent.com/54971670/210043084-922455b1-6bb4-4ec8-a1f5-a120fb11102a.PNG)

### JWT Modülünün Konfigürasyonu

JWT modülünü yapılandırmak için, Redis Modülünü yapılandırmak için kullandığımız `modüller.config.ts` dosyamızı yeniden kullanalım.

İlk olarak, içe aktardığımız modülü ekleyeceğiz ve `registerAsync` yöntemini ekleyeceğiz. Redis Modülünü başlatmak için benzer bir yöntem oluşturduğumuzu hatırlayın ve bunun nedeni JWT modülünü bir nevi taklit etmemizdir.

```ts
import { JwtModule } from "@nestjs/jwt";

// ... omitted content

export const jwtModule = JwtModule.registerAsync({});
```

Tıpkı `RedisModule` gibi bu modülün `ConfigModule` ve `ConfigService`'e erişmesi gerekir.

```ts
export const jwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
});
```

Ardından, yapılandırmaya veya bizim durumumuzda ortam değişkenlerine dayalı JWT seçeneklerimizi döndürecek olan yapılandırmamıza bir `useFactory` işlevi ekliyoruz.

```ts
export const jwtModule = JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>("JWT_SECRET"),
    signOptions: {
      expiresIn: parseInt(configService.get<string>("POLL_DURATION")),
    },
  }),
  inject: [ConfigService],
});
```

Gördüğünüz gibi JWT anahtarımızı `.env` dosyasından alacağız. Bu anahtar, token'ı imzalamak için kullanılır. Temel olarak, JWT'nin yalnızca belirtecimizin imzalandığı tam yük tarafından üretilen bir imza bölümünü oluşturur. Temel olarak, gerçek belirteç içeriğimiz artı anahtarın birleşimi, belirli bir imza üretecektir.

Belirteç üzerinde bir son kullanma süresi de belirleyebiliriz. Bizim durumumuzda, bunu `POLL_DURATION` ile aynı yapacağız. Gerçekte bu, belirteçlerimizin anketimizden biraz daha uzun yaşayacağı anlamına geliyor.

Şimdi bu yapılandırılmış sağlayıcıyı `polls.module.ts`'ye aktaralım ve kaydedelim.

```ts
import { jwtModule, redisModule } from "src/modules.config";

//... omitted content
@Module({
  imports: [ConfigModule, redisModule, jwtModule],
  controllers: [PollsController],
  providers: [PollsService, PollsRepository],
})
export class PollsModule {}
```

### JWT'nin Polls Service İçerisinde İmzalanması

Yapılandırılan JWT Modülü ile, Anket Modülümüzün içinde bir JWTService kullanabileceğiz ve bu eğitimde, onu daha spesifik olarak `polls.service.ts` içinde kullanacağız.

İlk önce yapıcımıza (constructor) `jwtService`'i ekleyeceğiz.

```ts
import { JwtService } from '@nestjs/jwt';

//...content omitted
 constructor(
    private readonly pollsRepository: PollsRepository,
    private readonly jwtService: JwtService,
  ) {}
```

Şimdilik tamamlayacağımız `createPoll` yöntemimizde bir "TODO" öğesi bıraktık.

```ts
this.logger.debug(
  `Creating token string for pollID: ${createdPoll.id} and userID: ${userID}`
);

const signedString = this.jwtService.sign(
  {
    pollID: createdPoll.id,
    name: fields.name,
  },
  {
    subject: userID,
  }
);

return {
  poll: createdPoll,
  accessToken: signedString,
};
```

İlk olarak, bir belirteç dizisi oluşturduğumuzu günlüğe kaydedeceğiz yani log kaydını alacağız.

Daha sonra, yeni sağlanan `JWTService`'imizin imzalama yani `sign` yöntemini kullanıyoruz. Bu aslında dizeyi oluşturur.

İlk argüman, JWT'mizin bir parçası olarak ekleyeceğimiz özel yani custom alanlara sahip bir nesnedir. İstemci veya kullanıcı verilerinin doğru yoklamanın bir parçası olarak iletilmesi veya saklanması için anket kimliği kullanılacaktır. Ad, kullanıcının `WebSockets` aracılığıyla bağlandıktan sonra anket katılımcısı olarak ilk kez kaydedildiği zaman kullanılacaktır.

İkinci parametre, standartlaştırılmış JWT alanlarını kabul eden bir nesnedir. Genellikle bir müşterinin kimliğini saklayan böyle bir alan konu (`subject`) alanıdır. Burası kullanıcı kimliğini saklayacağımız yer.

Şimdi `joinPoll` yöntemi için benzer bir şey yapalım.

```ts
this.logger.debug(
  `Creating token string for pollID: ${joinedPoll.id} and userID: ${userID}`
);

const signedString = this.jwtService.sign(
  {
    pollID: joinedPoll.id,
    name: poll.name,
  },
  {
    subject: userID,
  }
);

return {
  poll: joinedPoll,
  accessToken: signedString,
};
```

Bu, ilk kullanıcı anketi oluşturduğunda tam olarak aynı yapıyı alır.
