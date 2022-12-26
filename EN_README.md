
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

## 💾   To access the project

Open command prompt/terminal to a directory on your local machine and enter the following command:

```bash
git clone https://github.com/fatihes1/full-stack-voting-web-app.git
```

After the download of the project is complete, switch to the project directory using the following command:

```bash
cd full-stack-voting-web-app
```

As can be seen from the `.nvmrc` file in the project directory, switch to the required `node` version with the help of `nvm`:

```bash
nvm use 17.6.0
```

If your machine does not have the node version specified on `nvm`, you can download with `nvm install 17.6.0`.

Run the following command in the found project root directory to download all the requirements.

```bash
npm install
```

After making sure that `docker` is turned on on your local machine, you can boot the project using the command below. This command is already defined in `package.json`.

```bash
npm run start
```

This command will run the following command line in the background:

```bash
concurrently 'npm:docker:compose' 'npm:server:dev' 'npm:client:dev'
```

This command is firstly in the project root directory [docker-compose.yml](https://github.com/fatihes1/full-stack-voting-web-app/blob/main/docker-compose.yml "docker-compose) .yml") will download and restore the image/images in the file. In this project, only `redislabs/rejson:2.0.0` image was used.

After this stage, the server side will stand up first. Then the client side will stand up and be ready to work and be used on the project. The project can be accessed via `http:localhost:8080`.

