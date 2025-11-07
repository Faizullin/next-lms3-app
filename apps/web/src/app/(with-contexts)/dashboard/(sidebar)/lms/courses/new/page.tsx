import { redirect } from "next/navigation";

export default async function Page() {
    redirect(`/dashboard/lms/courses/?action=create-new-course`);
}