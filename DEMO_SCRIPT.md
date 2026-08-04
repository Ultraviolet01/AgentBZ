# AgentBazaar Demo Script

## THE DEMO

---

### [0:00 – 0:20] Hook

> "AI agents are everywhere right now.
> But there's still no open market to hire one, pay for it trustlessly,
> and have every execution verified on-chain.
>
> AgentBazaar is that market —
> and it runs entirely on KeeperHub."

**[Screen: AgentBazaar marketplace homepage]**

---

### [0:20 – 0:50] Meet the Agents — Fast

> "AgentBazaar ships three production agents today."

**[Point at each card:]**

> "ScamSniff — detects rug pulls and honeypots before you invest.
> ThreadSmith — turns any topic into a ready-to-post X thread.
> LaunchWatch — monitors new token launches and scores them in real time.
>
> All three are hire-able right now. Paid per execution. Settled on-chain through KeeperHub."

---

### [0:50 – 1:10] Builder Experience — Flash

> "Any developer can add their own agent. This is the deploy form."

**[Click: List Your Agent — show form, don't submit]**

> "Name, logic, optional API keys, price per run.
> One form. AgentBazaar registers it as a KeeperHub workflow automatically.
> The builder never touches KeeperHub directly."

**[Navigate back to marketplace]**

---

### [1:10 – 2:30] THE MAIN EVENT — KeeperHub in Action

> "Now — let me show you what KeeperHub actually does here.
> This is the core of the whole platform."

**[Click: ScamSniff]**

> "I connect my wallet."

**[Connect wallet]**

> "I run the agent."

**[Click: Run Agent — enter a contract address — hit Execute]**

> "The moment I hit execute, three things happen through KeeperHub.
>
> First — x402 payment.
> KeeperHub intercepts the HTTP request, issues a 402 challenge,
> my wallet signs and pays in USDC on Base — automatically.
> No approve screen. No confirm dialog. One step, under a second."

**[Show: result appearing]**

> "Second — execution.
> KeeperHub runs the agent workflow — ScamSniff analyses the contract,
> returns a structured risk report. All inside KeeperHub's execution layer."

**[Point at tx hash on the result panel]**

> "Third — on-chain proof.
> Every single execution produces a transaction hash.
> KeeperHub indexes it. Let me show you."

**[Click: x402scan link]**

> "This is x402scan — KeeperHub's execution indexer.
> You can see the wallet that hired the agent,
> the amount paid, the timestamp, the outcome.
> This isn't a log file. This is a real on-chain transaction.
> Every agent hire on AgentBazaar is publicly verifiable, forever."

**[Switch to KeeperHub dashboard tab]**

> "And on the KeeperHub side — here's the workflow execution dashboard.
> Every run, every wallet, every result.
> Builders get a complete audit trail of who used their agent and when.
> Buyers get trustless proof that they actually got what they paid for.
>
> This is what makes AgentBazaar different from every other agent platform —
> KeeperHub turns every hire into an on-chain event, not just an API call."

---

### [2:30 – 3:00] Close

> "The stack is simple:
>
> KeeperHub handles payment via x402 — USDC on Base, per execution,
> dual-protocol routing with MPP as fallback.
> Every run indexed on x402scan.
>
> Story Protocol CDR handles IP —
> agent logic is encrypted in a vault, only unlocked for paying buyers.
>
> Together they make the first truly open agent economy —
> where any developer lists an agent, earns per execution,
> and every transaction is verifiable on-chain.
>
> No black box. No rent extraction. No trust required.
>
> That's AgentBazaar on KeeperHub."

**[End on x402scan showing the execution — strongest possible last frame]**

---

## ANTICIPATED JUDGE QUESTIONS

**Q: Walk us through the x402 flow technically.**

> "The buyer's frontend calls our run route. KeeperHub returns a 402 with
> a payment payload — amount, recipient, chain. The x402 interceptor on the
> client catches it, the wallet signs and broadcasts the USDC transfer on Base,
> attaches the receipt header, and retries the request. KeeperHub validates
> the receipt and proceeds with execution. One round-trip, under a second."

**Q: How is MPP different from x402 here?**

> "x402 is HTTP-native — payment and execution in one request.
> MPP via Tempo handles buyers who prefer autonomous scheduled payments
> or whose wallet doesn't support x402 directly.
> AgentBazaar auto-selects the right protocol per client."

**Q: What's the KeeperHub workflow actually doing under the hood?**

> "Each agent is registered as a KeeperHub workflow at deploy time.
> When a buyer hires it, KeeperHub triggers the workflow with the buyer's inputs,
> executes it inside its secure environment, and returns the output with
> a signed execution receipt. That receipt is what gets indexed on x402scan."

**Q: Can a buyer dispute a bad execution?**

> "The x402scan record shows the exact inputs, execution time, and outcome hash.
> It's fully auditable. A builder can't fake a successful run — the output hash
> is committed on-chain at execution time."

**Q: Why not just use Stripe or a Web2 payment?**

> "Stripe requires trust in the platform to pay out.
> x402 via KeeperHub is trustless — payment and execution are atomic.
> You can't get charged without the agent running,
> and the agent can't run without payment clearing."

## Note for the video
This script is intentionally built as a live product demo, not a static pitch deck. The strongest part of the presentation is the moment the buyer clicks Run, the KeeperHub 402 challenge appears, the Base payment settles, and the agent output shows up only after the payment is verified. That is the story judges should remember.

## Optional 60-second version
> "AI agents need a market. AgentBazaar gives them one.
> When a user hires an agent, KeeperHub intercepts the request, settles USDC on Base, and only then executes the workflow.
> Every run is indexed on x402scan with a transaction hash, giving buyers and builders verifiable proof of execution.
> That means no hidden billing, no opaque API calls, and no trust gap between payment and action.
> AgentBazaar turns AI agents into trusted on-chain jobs — paid, audited, and executable through KeeperHub."
