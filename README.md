# Full Stack Voting Web App

<div  align="center">

![](https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![](https://img.shields.io/badge/redis-%23DD0031.svg?&style=for-the-badge&logo=redis&logoColor=white)
![](https://img.shields.io/badge/Socket.io-010101?&style=for-the-badge&logo=Socket.io&logoColor=white)
![](https://img.shields.io/badge/storybook-FF4785?style=for-the-badge&logo=storybook&logoColor=white)
![](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)
![](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![](https://img.shields.io/badge/eslint-3A33D1?style=for-the-badge&logo=eslint&logoColor=white)
![](https://img.shields.io/badge/prettier-1A2C34?style=for-the-badge&logo=prettier&logoColor=F7BA3E)

</div>

![nest1](https://user-images.githubusercontent.com/54971670/209147191-37124fec-734d-474d-ad49-25c7731a14bd.PNG)

## 💾 Projeye Erişmek İçin

Yerel makinenizde bir dizine komut istemi/terminal açarak aşağıdaki komutu girin:

```bash
git clone https://github.com/fatihes1/full-stack-voting-web-app.git
```

Projenin indirilme işlemi tamamlandıktan sonra aşağıdaki komutu kullanarak proje dizinine geçin:

```bash
cd full-stack-voting-web-app
```

Proje dizininde bulunan `.nvmrc` dosyasından anlaşılacağı üzere gerekli `node` sürümüne `nvm` yardımıyla geçiş yapın:

```bash
nvm use 17.6.0
```

Eğer makinenizde `nvm` üzerinde belirtilen node sürümü bulunmuyorsa `nvm install 17.6.0` ile indirme işlemini yapabilirsiniz.

Tüm gereklilikleri indirmek için bulunan proje kök dizininde aşağıdaki komutu çalıştırın.

```bash
npm install
```

Yerel makinenizde `docker`'ın açık olduğundan emin olduktan sonra aşağıdaki komutu kullanarak projeyi ayağa kaldırabilirsiniz. Bu komut `package.json` üzerinde halihazırda tanımlanmıştır.

```bash
npm run start
```

Bu komut arka planda aşağıda belirtilen komut satırını çalıştıracaktır:

```bash
concurrently 'npm:docker:compose' 'npm:server:dev' 'npm:client:dev'
```

Bu komut sırasıyla ilk olarak proje kök dizininde bulunan [docker-compose.yml](https://github.com/fatihes1/full-stack-voting-web-app/blob/main/docker-compose.yml "docker-compose.yml") dosyasında bulunan imaj/imajları indirerek ayağa kaldıracaktır. Bu proje kapsamında sadece `redislabs/rejson:2.0.0` image'ı kullanılmıştır.

Bu aşamadan sonra ilk olarak sunucu (server) tarafı ayağa kalkacaktır. Daha sonrasında ise istemci (client) tarafı ayağa kalkacaktır ve proje üzerinde çalışmaya ve kullanılmaya hazır olacaktır. `http:localhost:8080` üzerinden projeye erişilebilir.
