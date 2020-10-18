import { MikroORM } from "@mikro-orm/core"

const main = async () => {
  const orm = await MikroORM.init({
    dbName: 'lireddit',
    user: 'lireddit',
    password: 'lireddit',
    type: 'postgresql',
    debug: process.env.NODE_ENV !== 'production'
  })
  console.log(orm)
}

main()
