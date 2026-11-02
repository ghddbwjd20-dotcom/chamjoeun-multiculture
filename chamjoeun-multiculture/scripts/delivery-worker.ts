import { Pool } from "pg";
import { processDelivery,recoverDeliveries } from "../src/lib/delivery.ts";
import { sendingEnabled } from "../src/lib/delivery-policy.ts";
const db=new Pool({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:10000});
if(!sendingEnabled()){console.log("외부 발송은 비활성 상태입니다. NOTIFICATION_SENDING_ENABLED 설정 후 실행하세요.");await db.end();}
else {
  let stop=false;process.on("SIGINT",()=>{stop=true;});process.on("SIGTERM",()=>{stop=true;});
  try {await recoverDeliveries(db);do{await db.query("INSERT INTO worker_heartbeats(name,detail) VALUES('deliveries','running') ON CONFLICT(name) DO UPDATE SET last_run_at=now(),detail='running'");const worked=await processDelivery(db);if(process.argv.includes("--once"))break;if(!worked)await new Promise(resolve=>setTimeout(resolve,3000));}while(!stop);}finally{await db.end();}
}
