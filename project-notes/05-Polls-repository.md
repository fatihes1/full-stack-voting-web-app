# Polls Repository Oluşturulması

Bu notta, anketimizi docker-compose aracılığıyla oluşturduğumuz Redis veritabanımızın içinde depolamak için `IORedis Client` kullanacağız. Redis'i kullanmanın yanı sıra Redis'teki değerleri sanki bir JSON nesnesiymiş gibi depolamamıza, güncellememize ve almamıza izin veren `Redis JSON Modülünü` kullanacağız. . Bununla birlikte, bugün göreceğimiz gibi, anketimizin şeklini (type) sunucu ve istemci arasında paylaşmayı kolaylaştırıyor!

### Genel Bakış

Aşağıdaki şemada gösterildiği gibi, bir anket modülü (`Polls Module`) üzerinde çalışıyoruz. Bugün oluşturacağımız bir sağlayıcı olan `PollsRepository` dışındaki tüm blokları oluşturduk. Sağlanan bu depo ile hizmetimiz, Redis'te veri depolamak, güncellemek ve almak için depoya ulaşabilecektir.

![3-module](https://user-images.githubusercontent.com/54971670/209462723-c1d37f50-51a9-424f-a354-413704142c7c.PNG)

### PollsRepository Class'ının Oluşturulması ve Inject Edilmesi

Şimdi anketler depomuzu (`repository`) `polls.repository.ts` dosyasını anketler klasöründe oluşturacağız. Bunu, Anketler Modülümüzdeki diğer modüller için erişilebilir hale getirmemizi sağlayacak tanıdık `@Injectable` dekoratör ile oluşturacağız.

```ts
import { Inject } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";
import { IORedisKey } from "src/redis.module";

@Injectable()
export class PollsRepository {
  // to use time-to-live from configuration
  private readonly ttl: string;
  private readonly logger = new Logger(PollsRepository.name);

  constructor(
    configService: ConfigService,
    @Inject(IORedisKey) private readonly redisClient: Redis
  ) {
    this.ttl = configService.get("POLL_DURATION");
  }
}
```

Bu sınıfı özel bir ttl (time to live) yani yaşama zamanı ile oluşturuyoruz. Constructor'da, buna `PollsModule`'umuz için kullanıma sunulan `configService` aracılığıyla erişiriz. Bu ortam değişkeninin `.env` dosyasında ayarlandığını hatırlayın. Süreyi 2 saate eşit olan 7200 saniyeye ayarladık.

Ayrıca, hata ayıklama için yardımcı olacak, ancak uygulamayı üretime (`production`) alırsanız da yararlı olacak bir günlükçü (`Logger`) başlatıyoruz.

Daha sonra sınıfımızda `redisClient` adında özel bir `redisClient field` oluşturuyoruz. Sağladığımız bu istemciye, son not kısmında bu anketler modülüne eklediğimiz `RedisModule` aracılığıyla erişiyoruz. Bu modülde, kullanıcıyı bulmak için özel bir anahtar tanımladığımızı hatırlayın. Bu anahtarı içe aktarır ve `@Inject` alan dekoratörü ile birlikte kullanırız.

Artık Redis'te ve Redis'ten öğeleri depolamak, güncellemek ve almak için kullanılabilir veritabanı yapılandırmasına sahibiz.

Her zaman olduğu gibi, `PollsService`'in bu modülün sınıf yöntemlerini çağırmasına izin verecek olan `PollsModule`'de bu hizmeti veya depoyu kaydetmemiz gerekecek.

```ts
//omitted previous code
import { PollsRepository } from "./polls.repository";
import { PollsService } from "./polls.service";

@Module({
  imports: [ConfigModule, redisModule],
  controllers: [PollsController],
  providers: [PollsService, PollsRepository],
})
export class PollsModule {}
```

### Paylaşılan (shared) Type'ların Tanımlanması

Şimdi istemcimiz ve sunucumuz için ortak olacak türler için paylaşılan bir modül oluşturmak istiyorum. Bu aşırı, hatta akılsızca olabilir, ancak yine de öğrenmek için iyi olduğunu düşünüyorum. Ancak Anketimizin gerçek durumu, gelecekteki müşteri uygulamamızın durumu tarafından kullanılabilir ve Anketi veri tabanımızda saklandığı gibi tanımlamak için kullanılabilir.

İlk olarak, client ve server ile aynı seviyede olacak olan `share` adında bir klasör oluşturalım.

Npm çalışma alanlarını kullanarak özellikleri paylaşıyor olacağız. Bu yüzden bunu kök seviyesindeki `package.json`'umuza kaydetmemiz gerekiyor.

```json
  "workspaces": [
    "client",
    "server",
    "shared"
  ],
```

Ardından, paylaşılan klasörümüzde bir modül başlatmamız gerekecek. `npm init`'i kullanabilirsiniz, ancak ben sadece `share/package.json`'a aşağıdaki kodu ekleyeceğim.

```json
{
  "name": "shared",
  "version": "0.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "license": "MIT",
  "devDependencies": {
    "@types/react": "^17.0.39",
    "@types/react-dom": "^17.0.13",
    "socket.io-client": "^4.4.1",
    "typescript": "^4.5.3"
  }
}
```

Bu modül, `TypeScript`'i ve birkaç 3. taraf kütüphanesinden bazı türleri kullanmamıza izin veren bazı geliştirici bağımlılıklarına sahip olacaktır.

Şimdi bu modüle bir TypeScript konfigürasyonu verelim. Buraya istemci ve sunucu uygulamalarımız için TypeScript yapılandırmaları da ekleyebiliriz.

`tsconfig.json` dosyasını aşağıdaki gibi ekliyoruz:

```ts
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "strictNullChecks": true,
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react",
  },
  "include": ["."]
}
```

Doğru bir hatırlama olursa, kullandığımız TypeScript sürümü için tam olarak güncellenmemiş bazı modüller olduğundan, güncellemeyi sağladığım ana ayar `skipLibCheck` idi.

Şimdi çalışma alanımızın bu geliştirici bağımlılıklarına erişimi olduğundan emin olmak için npm kurulumunu çalıştıralım. Bunu yapmak için `npm install` komutunu kullanabiliriz.
Ardından anket türlerimizi `poll-types.ts`'de oluşturacağız.

```ts
export interface Participants {
  [participantID: string]: string;
}

export interface Poll {
  id: string;
  topic: string;
  votesPerVoter: number;
  participants: Participants;
  adminID: string;
  // nominations: Nominations;
  // rankings: Rankings;
  // results: Results;
  // hasStarted: boolean;
}
```

Şimdilik, yalnızca gösterilen 4 alanla anket oluşturacağız. Daha sonra, ihtiyaç duydukça diğer alanlar için tipler ekleyeceğiz.

Son olarak, `package.json`'da da tanımladığımız `index.ts`'de yapacağımız bu türleri export etmemiz gerekiyor.

```ts
export * from "./poll-types";
```

### Repository'nin Tanımlanması - Sadece Türleri

Şimdi yeni bir anket oluşturmak ve bir ankete katılımcı eklemek için ihtiyaç duyacağımız türleri ekleyelim. Bunları, hizmet türlerimiz için kullandığımız aynı `type.ts`'ye ekleyeceğiz.

```ts
// polls repository types
export type CreatePollData = {
  pollID: string;
  topic: string;
  votesPerVoter: number;
  userID: string;
};

export type AddParticipantData = {
  pollID: string;
  userID: string;
  name: string;
};
```

Repository türlerimiz için türlerimizin sonuna `Data` ekleyeceğiz.

### Polls Repository Metotları

Bu gerekliliği bir kenara bıraktıktan sonra artık depo metodlarımızı eklemeye hazırız. İlki, ilk anketi oluşturmak olacaktır.

```ts
// ...omitted content
import { Poll } from 'shared';
import { CreatePollData } from './types';
import { InternalServerErrorException } from '@nestjs/common/exceptions';

// ...omitted content

 async createPoll({
    votesPerVoter,
    topic,
    pollID,
    userID,
  }: CreatePollData): Promise<Poll> {
    const initialPoll = {
      id: pollID,
      topic,
      votesPerVoter,
      participants: {},
      adminID: userID,
    };

    this.logger.log(
      `Creating new poll: ${JSON.stringify(initialPoll, null, 2)} with TTL ${
        this.ttl
      }`,
    );

    const key = `polls:${pollID}`;

    try {
      await this.redisClient
        .multi([
          ['send_command', 'JSON.SET', key, '.', JSON.stringify(initialPoll)],
          ['expire', key, this.ttl],
        ])
        .exec();
      return initialPoll;
    } catch (e) {
      this.logger.error(
        `Failed to add poll ${JSON.stringify(initialPoll)}\n${e}`,
      );
      throw new InternalServerErrorException();
    }
  }
```

Yaptığımız ilk şey, işlev çağrıldığında iletilecek olan verileri çıkarmak. İlk anketimiz için anket kimliğini (`pollID`), konuyu (`topic`), yöneticiyi (`admin`) ve `votesPerVoter`'ı ayarladık. Bizim durumumuzda yönetici, anketi oluşturan kullanıcı olacak. Bu kullanıcıyı katılımcılar nesnesine eklemeyeceğiz. Bunun nedeni, katılımcıyı, kullanıcı web soketleriyle bağlandığında sağlanacak bir belirteç aracılığıyla ekleyeceğiz.

Daha sonra biraz log kaydı ekliyoruz.

Son olarak bu nesneyi `JSON` benzeri bir formatta Redis'e eklemek için kod ekliyoruz. Redis istemcisinin bazı çok temel düzey kullanımlarını kullandığımıza dikkat edin. Bunun nedeni, İstemcinin gelişmiş `RedisJSON` kullanım durumlarını desteklememesi veya sürüm 4'ten itibaren desteklememesidir. Artık sürüm 5 var, bu nedenle olası güncellemeleri incelemeye değer olabilir.

`IORedis` birden fazla yorum yapmamıza izin veriyor. İlk kod satırında, `polls:{pollID}` anahtarında bir JSON nesnesi ayarlamak için komutu gönderiyoruz. `.`anahtarın köküne erişmek için `RedisJSON` gösterimidir. Daha sonra Redis'te ayarlamak için JSON'u seri hale getirmemiz gerekiyor.

Yürüttüğümüz ikinci komut, bu anahtarda bir yaşam süresi ayarlamaktır.

Bu başarılı olursa, `InitialPoll`'u döndürürüz, aksi takdirde `NestJS` tarafından 500 dahili sunucu istisnası için sağlanan bir istisna atarız.

Benzer metotları `getPoll`'a ekleyelim.

```ts
  async getPoll(pollID: string): Promise<Poll> {
    this.logger.log(`Attempting to get poll with: ${pollID}`);

    const key = `polls:${pollID}`;

    try {
      const currentPoll = await this.redisClient.send_command(
        'JSON.GET',
        key,
        '.',
      );

      this.logger.verbose(currentPoll);

      // if (currentPoll?.hasStarted) {
      //   throw new BadRequestException('The poll has already started');
      // }

      return JSON.parse(currentPoll);
    } catch (e) {
      this.logger.error(`Failed to get pollID ${pollID}`);
      throw e;
    }
  }
```

Katılımcı eklemek için bir yönteme daha ihtiyacımız olacak.

```ts
// ...omitted content
import { AddParticipantData, CreatePollData } from './types';

//... omitted content
  async addParticipant({
    pollID,
    userID,
    name,
  }: AddParticipantData): Promise<Poll> {
    this.logger.log(
      `Attempting to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
    );

    const key = `polls:${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        participantPath,
        JSON.stringify(name),
      );

      const pollJSON = await this.redisClient.send_command(
        'JSON.GET',
        key,
        '.',
      );

      const poll = JSON.parse(pollJSON) as Poll;

      this.logger.debug(
        `Current Participants for pollID: ${pollID}:`,
        poll.participants,
      );

      return poll;
    } catch (e) {
      this.logger.error(
        `Failed to add a participant with userID/name: ${userID}/${name} to pollID: ${pollID}`,
      );
      throw e;
    }
  }
```

### PollsService'ten Repository Metodlarının Çağrılması

Şimdi mevcut servis metotlarımız üzerinden depoya erişelim.
Bunu yapmak için, yapıcı aracılığıyla `enjekte edilen` `PollsRepository`'ye erişmemiz gerekecek.

```ts
import { Injectable, Logger } from "@nestjs/common";
// ... omitted content
import { PollsRepository } from "./polls.repository";
// ... omitted content

@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);
  constructor(private readonly pollsRepository: PollsRepository) {}
  // ... omitted content
}
```

Eklerken bir lod kaydı ekleyeceğiz.

Ardından `createPoll`'umuzu aşağıdaki gibi güncelliyoruz.

```ts
 async createPoll(fields: CreatePollFields) {
    const pollID = createPollID();
    const userID = createUserID();

    const createdPoll = await this.pollsRepository.createPoll({
      ...fields,
      pollID,
      userID,
    });

    // TODO - create an accessToken based off of pollID and userID

    return {
      poll: createdPoll,
      // accessToken
    };
  }
```

Şimdi de `joinPoll` işlevini güncelleyelim.

```ts
  async joinPoll(poll: JoinPollFields) {
    const userID = createUserID();

    this.logger.debug(
      `Fetching poll with ID: ${poll.pollID} for user with ID: ${userID}`,
    );

    const joinedPoll = await this.pollsRepository.getPoll(poll.pollID);

    // TODO - create access Token

    return {
      poll: joinedPoll,
      // accessToken: signedString,
    };
  }
```

Son olarak `rejoinPoll` işlevini güncelleyelim.

```ts
  async rejoinPoll(fields: RejoinPollFields) {
    this.logger.debug(
      `Rejoining poll with ID: ${fields.pollID} for user with ID: ${fields.userID} with name: ${fields.name}`,
    );

    const joinedPoll = await this.pollsRepository.addParticipant(fields);

    return joinedPoll;
  }
```

HTTP isteğimizde `rejoinPollFields` göndererek bunu şimdilik test edeceğiz, ancak daha sonra bu ayrıntılar bir JSON Web Token'dan çıkarılacak.
