"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { vapi } from "@/lib/vapi.sdk"
import { interviewer } from "@/constants"
import { createFeedback } from "@/lib/actions/general.action"

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant"
  content: string
}

interface AgentProps {
  userName: string
  userId: string
  interviewId: string
  feedbackId: string
  type: string
  questions?: string[]
}

interface Message {
  type: string
  transcriptType: string
  role: "user" | "system" | "assistant"
  transcript: string
}

const Agent = ({ userName, userId, interviewId, feedbackId, type, questions }: AgentProps) => {
  const router = useRouter()
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE)
  const [messages, setMessages] = useState<SavedMessage[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastMessage, setLastMessage] = useState<string>("")
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE)
    }

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED)
    }

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript }
        setMessages((prev) => [...prev, newMessage])
      }
    }

    const onSpeechStart = () => {
      console.log("speech start")
      setIsSpeaking(true)
    }

    const onSpeechEnd = () => {
      console.log("speech end")
      setIsSpeaking(false)
    }

    const onError = (error: Error) => {
      console.log("Error:", error)

      // Check if it's a card expiration error (400 status) with proper null checks
      const errorMessage = error?.message || error?.toString() || ""
      const errorString = typeof error === "string" ? error : errorMessage

      if (
        errorString.includes("400") ||
        errorString.includes("Failed to load resource") ||
        errorString.includes("server responded with a status of 400")
      ) {
        setErrorMessage("Your card has expired. Please update your payment method to continue.")
        setShowErrorPopup(true)
        setCallStatus(CallStatus.INACTIVE)
      }
    }

    vapi.on("call-start", onCallStart)
    vapi.on("call-end", onCallEnd)
    vapi.on("message", onMessage)
    vapi.on("speech-start", onSpeechStart)
    vapi.on("speech-end", onSpeechEnd)
    vapi.on("error", onError)

    return () => {
      vapi.off("call-start", onCallStart)
      vapi.off("call-end", onCallEnd)
      vapi.off("message", onMessage)
      vapi.off("speech-start", onSpeechStart)
      vapi.off("speech-end", onSpeechEnd)
      vapi.off("error", onError)
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content)
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback")

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      })

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`)
      } else {
        console.log("Error saving feedback")
        router.push("/")
      }
    }

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/")
      } else {
        handleGenerateFeedback(messages)
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId])

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING)

    if (type === "generate") {
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          username: userName,
          userid: userId,
        },
      })
    } else {
      let formattedQuestions = ""
      if (questions) {
        formattedQuestions = questions.map((question) => `- ${question}`).join("\n")
      }

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        },
      })
    }
  }

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED)
    vapi.stop()
  }

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image src="/ai-avatar.png" alt="profile-image" width={65} height={54} className="object-cover" />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn("transition-opacity duration-500 opacity-0", "animate-fadeIn opacity-100")}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn("absolute animate-ping rounded-full opacity-75", callStatus !== "CONNECTING" && "hidden")}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED" ? "Call" : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
      {showErrorPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Payment Error</h3>
              <button
                onClick={() => setShowErrorPopup(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowErrorPopup(false)
                  router.push("/billing") // Redirect to billing page
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Update Payment
              </button>
              <button
                onClick={() => {
                  setShowErrorPopup(false)
                  router.push("/") // Go back to home
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Agent
