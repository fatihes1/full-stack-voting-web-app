# Uygulamaya Genel Bakış

Aşağıdaki şekil, bu uygulamayı oluşturmak için kullanacağımız araçlara, dillere veya çerçevelere genel bir bakış sunar.

![nest1](https://user-images.githubusercontent.com/54971670/209147191-37124fec-734d-474d-ad49-25c7731a14bd.PNG)

### Proje Kök Dizinine Genel Bakış
Proje kökünde birkaç önemli dosyamız var. İlk önce bir `package.json`'umuz var. Bu, tüm uygulamalarımızı npm paketlerini veya npm komutlarıyla projeyi çalıştırmak için betikler içeren oldukça basit bir dosyadır. İstemci ve sunucu dizinle uygulamalarımız için de `workspaces` altında tanımlarız. Bu uygulamalara birazdan geleceğiz. Bunları projenin kökünden ayrı olarak başlatabilir veya `npm run start` kullanarak hepsini çalıştırabiliriz.

Ancak devam etmeden önce, kök dizinde `npm install` komutunu çalıştıralım. Bu, çalışma alanlarımızın (workspaces) içinde de bağımlılıklar kuracaktır.

Bu komut, uygulamamız için ana veritabanı olacak olan docker-compose ile bir redis-json docker konteynerini başlatır. Konteyner (Container) yapılandırması docker-compose.yml dosyasında bulunur.

"`server:dev`" betiği içerisinde bulunan `wait-on` komutu, Redis kapsayıcımızın çalışmasını ve portunu açığa çıkarmasını beklememizi sağlar. Redis portu kullanılabilir olduğunda, sunucu uygulamasını başlatabiliriz. Daha sonra hem istemci hem de sunucu uygulamalarımızı başlatmak için eşzamanlı (concurrently) komutu kullanırız.

Ayrıca, bu proje için önceden oluşturulan bazı UI bileşenleriyle oynamamıza izin verecek bir `storybook` komutumuz da var. Buna birazdan bakacağız.

### İstemci Uygulaması

Projeninin istemci uygulaması, `client` klasörünün içinde bulunur. Bu, uygulama boyunca kullanacağımız bağımlılıkları zaten eklemiş olmam dışında, basit bir `React` uygulamasıdır.

Ön uç geliştirme araçlarımız için vite kullanacağız. ViteJS'yi bir bağımlılık olarak kurduk ve temel bir vite config dosyamız var.

Ayrıca `React`, `TypeScript` ve daha güzel biçimlendirici ile çalışmak üzere `ESLINT` yapılandırması için dosyalarımız var. İlgili `TypeScript` yapılandırması (config dosyası) ve `Prettier` yapılandırma (config dosyası)  dosyaları da dahildir.

Stillerimiz için `TailwindCSS` kullanacağız. Yaygın olarak kullanıldığı için bunu seçtim. Bununla çok süslü bir şey yapmayacağız, bu yüzden temel bir CSS anlayışı veya başka bir CSS çerçevesi ile birlikte takip edebileceğinizi düşünüyorum.

`src` klasörümüz, daha sonra ele alacağımız yardımcı program (utility)  ve veri alma işlevlerine sahip bazı temel dosyalara sahiptir. Ayrıca `index.css` adında global bir stil dosyası vardır.

Önceden oluşturulan uygulamanın bir kısmı, `src/components` klasöründe bulunabilen bazı temel UI bileşenleriydi. Bu bileşenler hakkında bir fikir edinmeniz için uygulamaya `Storybook`'u da ekledim. Bu notlarda Storybook'tan çok bahsetmeyeceğiz, ama ne işe yaradığını görmek için `npm run storybook`'u çalıştıralım. Bu komutu istemci klasöründen veya proje kökünden çalıştırabilirsiniz.
*storybook'u çalıştırın ve bazı bileşenleri gösterin*

### Sunucu Uygulaması

Şimdi sunucu klasörüne ve uygulamaya dönelim. Bu uygulama, `NodeJS` sunucu uygulamaları oluşturmak için bir framework olan `NestJS`'yi çalıştıracak şekilde ayarlanmıştır. 

Bu proje de istemci gibi benzer bir konfigürasyon (ESLINT, PRETTIER, TYPESCRIPT) kullanır. Yani kullanılan teknoloji ve araçlar o kadar da farklı değil!

Bu uygulama, bir `.env` dosyasından bazı ortam yapılandırmalarını yükleyen ve `8080` numaralı port bağlantı noktasında bir sunucuyu başlatan basit bir `main.js` dosyasına sahiptir.

Devam etmeden önce, sunucu ve istemci uygulaması arasında paylaşılan ortak veri türleri için daha sonra ortak bir çalışma (`shared`) alanı oluşturacağımızı belirtmek isterim.

### Uygulamanın Çalıştırılması

Şimdi geliştirme ortamımızı kök dizinden `npm run start` ile çalıştıralım... sadece her şeyin yolunda ve düzgün çalıştığından emin olmak için.
