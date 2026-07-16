import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import HomeClient from "./component/HomeClient";

export default async function Home() {

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session){
    return (
      <div className=" flex flex-col items-center justify-center h-screen gap-4 ">
        <h1 className="text-4xl font-bold  ">Huzeyfa Solution</h1>
        <div className=" flex gap-4 mt-8 ">
          <Button className="bg-amber-600 " asChild size="lg">
            <Link href="/signup">SignUp</Link>
          </Button>
          <Button className="bg-amber-600 " variant="outline" size="lg" >
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }
  return <HomeClient />
}
