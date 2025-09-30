import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/lib/actions/auth.action';

export async function POST(request: NextRequest) {
  try {
    // Clear the session cookie
    await signOut();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Signout error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sign out' 
      },
      { status: 500 }
    );
  }
}
