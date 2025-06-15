import { Button } from '@/components/ui/button'
import { Link } from 'lucide-react'
import React from 'react'
import Image from 'next/image'
import { dummyInterviews } from '@/constants'
import { Inter } from 'next/font/google'
import InterviewCard from '@/components/InterviewCard'

const page = () => {
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
          {dummyInterviews.map((interview) => (
            <InterviewCard {...interview} key={interview.id}/>
          ))}
        </div>
          <p>You haven&apos;t taken any interviews yet</p>
      </section>
      <section className = "flex flex-col gap-6 mt-8"></section>
      <h2>Take an Interview</h2>
      <div className = "interviews-section">
          {dummyInterviews.map((interview) => (
            <InterviewCard {...interview} key={interview.id}/>
          ))}
        {/*<p>You have&apos;t taken any Interviews yet</p>*/}
      </div>
    </>
  )
}

export default page
