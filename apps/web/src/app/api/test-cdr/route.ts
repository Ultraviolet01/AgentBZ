import { NextRequest, NextResponse } from 'next/server';
import { deployAgentCDR } from '@/lib/cdr-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('[Test CDR Route] Triggering test deployAgentCDR...');
    const result = await deployAgentCDR({
      name: 'CDR Integration Test Agent',
      description: 'Verifying Story Protocol CDR deployment on local env.',
      logic: 'You are a test agent. Answer test requests.',
      apiKeys: [
        { name: 'OPENAI_API_KEY', value: 'sk-test-value-1234567890' }
      ]
    });

    console.log('[Test CDR Route] Success!', result);
    return NextResponse.json({
      success: true,
      message: 'CDR deployAgentCDR test succeeded!',
      result
    });
  } catch (error: any) {
    console.error('[Test CDR Route] Failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
      stack: error.stack
    }, { status: 500 });
  }
}
