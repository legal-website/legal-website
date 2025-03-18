// This is a simple script to generate the Prisma client
// Run it with: npx ts-node scripts/generate-prisma.ts

import { exec } from "child_process"

console.log("Generating Prisma client...")

exec("npx prisma generate", (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`)
    return
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`)
    return
  }

  console.log(`stdout: ${stdout}`)
  console.log("Prisma client generated successfully!")
})

