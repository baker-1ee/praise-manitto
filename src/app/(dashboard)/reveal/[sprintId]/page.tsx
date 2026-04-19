import { redirect } from 'next/navigation'

export default function RevealRedirect({ params }: { params: { sprintId: string } }) {
  redirect(`/reveal/${params.sprintId}`)
}
