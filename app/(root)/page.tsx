import { Button } from '@/components/ui/button'
import { Link } from 'lucide-react'
import React from 'react'
import Image from 'next/image'
import InterviewCard from '@/components/InterviewCard'
import { getCurrentUser, getInterviewByUserId, getLatestInterviews } from '@/lib/actions/auth.action'
 

const page = async () => {

  const user = await getCurrentUser();

  const [ userInterviews, latestInterviews] = await Promise.all([
    await getInterviewByUserId(user?.id!),
    await getLatestInterviews({userId:user?.id!})
  ])

  const hasPastInterviews = userInterviews?.length > 0;
  const hasUpcomingInterviews = latestInterviews?.length > 0;

  return (
    <>
      <section className = "card-cta">
        <div className = "flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-powered Practice and Feedback</h2>
          <p className= "text-lg">
            Practise Realtime Interview Questions and Review your Readiness with feedback
          </p>
          <Button asChild className = "btn-primary max-sm:w-full"> 
            <Link href= "/interview">Start the interview</Link>
          </Button>
        </div>
        <Image src="/robot.png" alt="robo-friend" width={400} height={400} className = "max-sm:hidden" />
      </section>
      <section className = "flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>
        <div className = "interviews-section">
          {hasPastInterviews?(
              userInterviews?.map((interview)=> (
                <InterviewCard {...interview} key={interview.id}/>
              ))) : (
                <p>You haven&apos;t taken any interviews yet</p>
          )}
        </div>          
      </section>
      <section className = "flex flex-col gap-6 mt-8"></section>
      <h2>Take an Interview</h2>
      <div className = "interviews-section">
          {hasUpcomingInterviews?(
              latestInterviews?.map((interview)=> (
                <InterviewCard {...interview} key={interview.id}/>
              ))) : (
                <p>You haven&apos;t taken any interviews yet</p>
          )}
        {<p>There are no Interviews that are available</p>}
      </div>
    </>
  )
}

export default page
