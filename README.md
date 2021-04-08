# chat-app
This is a chat app by using Nodejs, GraphQL, MySQL. I cloned **Classsed** tutorial from his [youtube channel](https://www.youtube.com/watch?v=LvfJ2wEpMrs&list=PLMhAeHCz8S3_VYiYxpcXtMz96vePOuOX3&index=1)

## 建立 MySQL

### 使用 Docker

```
建立密碼為 root 的 chat 資料庫
docker run --name classsed-chat-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=chat -p 3306:3306 -d mysql:8.0
```

修改 config/config.json 內的 `"host": "0.0.0.0"`，即可連線至 Docker container

```
透過 Terminal 用 root 帳號登入 chat 資料庫
docker exec -it classsed-chat-mysql mysql -u root -p chat
```

### 新增 model (table)
建立新的model叫 User。在 models 目錄下會出現 user.js 以及 migrations 目錄下會出現日期時間編號的.js檔案 (兩者都可以更改內容)
```
sequelize model:generate --name User --attributes username:string,email:string
```
更新到mysql，建立 table
```
sequelize db:migrate
```
取消上次的migration (會將 DB 資料清掉)
```
sequelize db:migrate:undo
搭配 show tables; 查看上次建立的 table 會消失。
取消所有的migration
sequelize db:migrate:undo:all
```
建立新的model叫 Message。 用來紀錄對話的內容，傳送人及收訊人
```
sequelize model:generate --name Message --attributes content:string,uuid:uuid,from:string,to:string
sequelize db:migrate
```
產生 seeders 資料到 DB
```
產生 seeders/xxxxx-create-users.js
sequelize seed:generate --name create-users

產生 seeders/xxxxx-create-messages.js
sequelize seed:generate --name create-messages

migrate DB undo
sequelize db:migrate:undo:all

migrate DB
sequelize db:migrate

將 seeders 內的資料產生進 DB
sequelize db:seed:all
```

建立新的model叫 Reaction 紀錄對話的emoji
```
sequelize model:generate --name Reaction --attributes content:string,uuid:uuid
```

新增兩筆資料
```
mysql> insert into `users` (`username`, `email`, `createdAt`, `updatedAt`) values ('bacon', 'bacon@mail.com', '2020-09-24 10:00:00', '2020-09-24 10:00:00');

mysql> insert into `users` (`username`, `email`, `createdAt`, `updatedAt`) values ('lynn', 'lynn@mail.com', '2020-09-24 11:00:00', '2020-09-24 11:00:00');
```
查看特定table的 schema
```
查看 users table 欄位
mysql> describes users;
```
清空user table 的資料
```
mysql> delete from users;
```
