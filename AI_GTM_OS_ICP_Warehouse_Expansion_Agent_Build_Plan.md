# AI GTM Operating System
## Lightweight ICP Discovery Agent: Warehouse Expansion Intelligence

> **Runtime decision:** The application calls an OpenAI-compatible model API directly from its backend.

**Buildathon scope:** AI as Agency / AI as a Service  
**Estimated MVP build time:** 4–5 hours  
**Primary goal:** Build one focused, working agent inside the broader AI GTM Operating System.

---

## 1. Product Positioning

The **AI GTM Operating System** is a modular agentic platform intended to help B2B companies discover, qualify, engage, and convert high-intent prospects.

For the buildathon, the team will not attempt to build the full GTM OS. Instead, it will build a lightweight first module:

- **Product:** AI GTM Operating System
- **Agent:** ICP Discovery Agent
- **Specialization:** Warehouse Expansion Intelligence

The agent identifies companies showing warehouse or fulfilment expansion signals and converts those signals into explainable, prioritized B2B sales opportunities.

### One-line submission description

> A lightweight ICP Discovery Agent within an AI GTM Operating System that detects warehouse expansion signals, scores buying intent, recommends the most relevant supply-chain solution, and generates personalized outreach.

---

## 2. Target Users

The MVP is designed for B2B companies selling to warehouse, logistics, retail, manufacturing, and fulfilment operations, including:

- Warehouse Management System providers
- Warehouse automation and robotics vendors
- 3PL and fulfilment providers
- Inventory and supply-chain SaaS companies
- Material-handling equipment providers
- Logistics consulting firms
- Barcode, RFID, and warehouse visibility solution providers

---

## 3. Problem Statement

Traditional lead databases rely on static filters such as industry, revenue, geography, and employee count. These filters may identify companies that fit an ICP, but they do not reveal whether the company is entering an active buying window.

Sales and GTM teams manually search news, company announcements, job posts, funding updates, industrial property reports, and expansion plans to find such opportunities. The research is fragmented, repetitive, and difficult to scale.

The lightweight ICP Discovery Agent answers:

> Which companies are likely to require a warehouse or supply-chain solution soon, why are they likely to buy, and what should the sales team do next?

---

## 4. MVP Outcome

The agent will accept a company announcement, article text, URL-derived content, or a prepared sample dataset. It will then:

1. Detect warehouse expansion signals.
2. Extract structured company and event details.
3. Calculate an explainable intent score.
4. Match the opportunity to a relevant solution.
5. Recommend a next sales action.
6. Generate a short personalized outreach message.
7. Display the result in a simple dashboard.

---

## 5. Core User Flow

1. User enters the solution they sell, such as WMS, warehouse automation, robotics, 3PL, or inventory optimization.
2. User chooses a target region or industry.
3. User pastes an article, announcement, or sample company event.
4. The agent analyzes the content.
5. The agent extracts expansion signals and evidence.
6. The agent assigns an expansion-intent score.
7. The agent recommends a product fit and sales action.
8. The agent generates a LinkedIn message or email opener.
9. User reviews or exports the result.

---

## 6. Signals to Detect

The MVP should support a controlled set of signals rather than attempting broad web intelligence.

### High-value signals

- New warehouse or fulfilment centre announced
- Industrial property or warehouse lease signed
- New distribution centre opened
- Entry into a new region or country
- Increase in fulfilment or storage capacity
- Warehouse automation or robotics investment
- Hiring for warehouse, logistics, operations, or supply-chain leadership
- Funding or capital raise linked to expansion

### Optional secondary signals

- New retail stores or e-commerce market launch
- ERP, WMS, TMS, or digital transformation initiative
- Acquisition of a logistics or distribution business
- Customer complaints about fulfilment capacity

---

## 7. Lightweight Agent Architecture

The MVP can be implemented as one orchestrating agent with four internal functions. This is faster and more reliable than building multiple fully independent agents within the buildathon window.

```text
User Input
   |
   v
ICP Discovery Orchestrator
   |
   +--> Signal Extractor
   |
   +--> Intent Scorer
   |
   +--> Solution Matcher
   |
   +--> Outreach Generator
   |
   v
Opportunity Card / JSON Response
```

### 7.1 ICP Discovery Orchestrator

Coordinates the workflow, validates inputs, calls each function in sequence, and combines the final response.

### 7.2 Signal Extractor

Extracts:

- Company name
- Industry
- Event type
- Location
- Event date, when available
- Evidence sentence
- Detected signals
- Confidence level

### 7.3 Intent Scorer

Calculates a score from 0–100 using deterministic weights plus AI reasoning.

Suggested scoring model:

| Signal | Weight |
|---|---:|
| New warehouse or fulfilment centre | 30 |
| Warehouse lease or property acquisition | 25 |
| Automation investment | 20 |
| Supply-chain or warehouse leadership hiring | 15 |
| Regional expansion | 15 |
| Funding linked to operational growth | 10 |
| Recent event within 90 days | 10 |
| Weak or unverified evidence | -10 |

Cap the final score at 100.

Suggested intent bands:

- **80–100:** High-priority opportunity
- **60–79:** Strong prospect requiring validation
- **40–59:** Early signal; monitor or nurture
- **0–39:** Low-confidence or low-relevance lead

### 7.4 Solution Matcher

Maps detected signals to likely needs.

Examples:

- New fulfilment centre → WMS, inventory visibility, automation, 3PL support
- Robotics investment → systems integration, WES, maintenance, analytics
- Regional expansion → 3PL, TMS, customs, distributed inventory management
- Warehouse hiring spike → process consulting, workforce tools, WMS modernization

### 7.5 Outreach Generator

Produces:

- One short email opener
- One LinkedIn message
- One recommended next action

The message must reference the detected expansion event and avoid unsupported claims.

---

## 8. Input and Output Schema

### Input

```json
{
  "seller_solution": "Warehouse Management System",
  "target_industry": "Retail and e-commerce",
  "target_region": "India",
  "source_text": "Company announcement or article text",
  "source_url": "optional"
}
```

### Output

```json
{
  "company_name": "Example Retail Ltd",
  "industry": "Retail",
  "event_type": "New fulfilment centre",
  "location": "Bengaluru, India",
  "signals": [
    "New fulfilment centre announced",
    "Hiring warehouse operations leadership"
  ],
  "evidence": [
    "The company announced a new fulfilment centre in Bengaluru."
  ],
  "intent_score": 86,
  "intent_level": "High-priority opportunity",
  "recommended_solution": "Warehouse Management System and inventory visibility",
  "reasoning": "The new facility is likely to require inventory, picking, and operational control systems.",
  "recommended_contact_role": "VP Supply Chain or Head of Warehouse Operations",
  "next_action": "Research the facility timeline and initiate contextual outreach.",
  "linkedin_message": "...",
  "email_opener": "...",
  "confidence": 0.88
}
```

---

## 9. Recommended MVP Technology Stack

Choose the simplest stack the team can implement confidently.

### Fastest option

- **UI:** Streamlit
- **Application logic:** Python
- **LLM:** OpenAI-compatible model called directly by the backend
- **Validation:** Pydantic
- **Storage:** JSON file or SQLite
- **Export:** CSV or JSON download

### Optional alternative

- **Frontend:** Next.js
- **Backend:** FastAPI
- **Storage:** Supabase

For a 4–5 hour build, Streamlit with Python is recommended.

---

## 10. Suggested Project Structure

```text
warehouse-expansion-agent/
├── app.py
├── README.md
├── requirements.txt
├── .env.example
├── data/
│   └── sample_events.json
├── prompts/
│   ├── extract_signals.md
│   ├── match_solution.md
│   └── generate_outreach.md
├── src/
│   ├── __init__.py
│   ├── schemas.py
│   ├── orchestrator.py
│   ├── signal_extractor.py
│   ├── intent_scorer.py
│   ├── solution_matcher.py
│   └── outreach_generator.py
└── tests/
    └── test_scoring.py
```

---

## 11. Implementation Steps

### Step 1: Initialize the project

```bash
mkdir warehouse-expansion-agent
cd warehouse-expansion-agent
python -m venv .venv
source .venv/bin/activate
pip install streamlit openai pydantic python-dotenv pandas
```

Create `.env.example`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-sol
```

Do not commit the real `.env` file.

### Step 2: Define the data models

Create Pydantic models for:

- UserInput
- ExpansionSignal
- AgentResult
- OutreachResult

Require structured output from the model wherever possible.

### Step 3: Build the signal-extraction prompt

The prompt should instruct the model to:

- Use only facts present in the source text.
- Extract warehouse expansion signals.
- Quote or paraphrase evidence.
- Return valid JSON.
- Mark uncertain values as null.
- Never invent company names, locations, dates, or events.

### Step 4: Implement deterministic intent scoring

Keep scoring outside the LLM. The LLM identifies signals; Python applies the weights. This makes the demo explainable and repeatable.

### Step 5: Implement solution matching

Use a small rule-based mapping first. Use the LLM only to write the explanation.

### Step 6: Implement outreach generation

Generate short, contextual copy based on verified evidence. Add a human-review requirement before sending.

### Step 7: Build the Streamlit UI

Recommended UI sections:

- Product header and one-line description
- Seller solution selector
- Target industry and region inputs
- Source text area
- Analyze button
- Intent score metric
- Detected signals
- Evidence
- Recommended solution
- Recommended contact role
- Outreach messages
- Export JSON/CSV button

### Step 8: Add sample data

Prepare three to five synthetic or publicly sourced examples:

1. Strong expansion signal
2. Moderate hiring-based signal
3. Funding without warehouse evidence
4. Weak or irrelevant article
5. Multi-signal high-intent account

### Step 9: Test failure cases

Test:

- Empty input
- No company name
- No warehouse signal
- Contradictory content
- Old event
- Multiple companies in one article
- Model returns invalid JSON

### Step 10: Prepare the demo

Use one strong scenario and one weak scenario to show that the system can distinguish high- and low-intent opportunities.

---

## 12. Codex Build Instructions

Use Codex as the coding and orchestration assistant for the repository. Codex is a development tool and is not part of the deployed application architecture.

### Recommended first Codex prompt

```text
You are implementing a buildathon MVP called "AI GTM Operating System – Lightweight ICP Discovery Agent: Warehouse Expansion Intelligence."

Build a Python Streamlit application with the following workflow:
1. Accept seller solution, target industry, target region, and source article text.
2. Use an OpenAI-compatible LLM to extract warehouse expansion signals into a strict Pydantic schema.
3. Calculate a deterministic intent score in Python using configurable signal weights.
4. Match the opportunity to a relevant warehouse or supply-chain solution.
5. Generate a short LinkedIn message, email opener, recommended contact role, and next action.
6. Display the results in a clean Streamlit dashboard.
7. Include sample data, error handling, .env.example, requirements.txt, README.md, and one unit test for scoring.

Constraints:
- Never fabricate facts not found in the supplied source text.
- Keep all sending actions human-approved; do not send messages automatically.
- Prefer simple, readable modules over excessive abstraction.
- Use structured model outputs and validate them with Pydantic.
- The project must run locally with `streamlit run app.py`.

First create the complete repository structure and implementation checklist. Then implement files one by one, run tests, and fix errors.
```

### Suggested Codex workflow

```bash
cd warehouse-expansion-agent
codex
```

Inside Codex:

1. Paste the build prompt.
2. Ask it to create the repository structure.
3. Review generated files before allowing broad changes.
4. Ask it to run the unit test.
5. Ask it to start Streamlit and fix runtime errors.
6. Test the sample scenarios manually.
7. Ask it to produce a final README and demo script.

### Follow-up Codex prompts

**For debugging**

```text
Run the application and tests. Diagnose the current errors, make the smallest safe fixes, and explain each changed file.
```

**For UI refinement**

```text
Improve the Streamlit UI for a buildathon demo. Keep it lightweight. Emphasize the intent score, evidence, recommended solution, and generated outreach. Do not add unnecessary dependencies.
```

**For reliability**

```text
Audit the project for fabricated facts, invalid JSON handling, missing environment variables, empty inputs, and model API failures. Add graceful error messages and fallback behavior.
```

---

## 13. 4–5 Hour Build Schedule

### Git collaboration cadence

Treat `origin/main` as the shared source of truth throughout the build:

1. Before starting a work block, run `git pull --rebase origin main`.
2. Pull again before integrating work or pushing when another teammate may have updated `main`.
3. Keep commits small and coherent: one contract change, backend function, UI component, test group, or documentation update per commit.
4. Run the checks relevant to the changed area before committing.
5. Push each verified increment promptly instead of accumulating a large local batch.
6. If a rebase conflicts, resolve it against the frozen shared contract and rerun affected checks before pushing.
7. Never force-push shared `main`; use `git push origin main` after a successful rebase.

Recommended loop:

```bash
git pull --rebase origin main
# make one focused change
pnpm test
pnpm typecheck
git add <focused-files>
git commit -m "type(scope): concise change"
git pull --rebase origin main
git push origin main
```

### Hour 1: Foundation

- Initialize repository and environment
- Create schemas and sample dataset
- Build extraction prompt
- Confirm one structured LLM response

### Hour 2: Core Intelligence

- Implement signal extraction
- Implement deterministic scoring
- Implement solution mapping
- Test with two sample inputs

### Hour 3: User Experience

- Build Streamlit form and results dashboard
- Add intent score, evidence, recommendations, and outreach display
- Add input validation and errors

### Hour 4: Demo Readiness

- Add sample scenarios
- Add JSON/CSV export
- Write README
- Run tests and end-to-end checks

### Optional final hour

- Refine UI
- Add source URL field
- Add simple history using SQLite or session state
- Record fallback demo screenshots or output examples

---

## 14. MVP Acceptance Criteria

The build is complete when:

- The application runs with `streamlit run app.py`.
- A user can paste source content and receive a structured result.
- At least five warehouse expansion signal types are supported.
- Intent scoring is deterministic and visible.
- Evidence is shown for each detected signal.
- The agent recommends a relevant solution and contact role.
- It generates contextual outreach.
- Weak evidence produces a lower score.
- The system handles API and parsing errors gracefully.
- No message is sent automatically.

---

## 15. Non-Goals for the Buildathon

Do not spend MVP time on:

- Continuous web crawling
- Large-scale enrichment databases
- Automated LinkedIn or email sending
- Full CRM integration
- Multi-user authentication
- Advanced vector databases
- Predictive machine-learning training
- Complex multi-agent infrastructure
- Perfect production security or observability

These can be shown as future roadmap items.

---

## 16. Mentor Overview

We are building the first lightweight agent within a broader **AI GTM Operating System**. The full vision is a modular set of agents for market intelligence, ICP discovery, outreach, CRM, campaign optimization, and revenue operations.

For the buildathon, we are focusing on the **ICP Discovery Agent**, specialized in **Warehouse Expansion Intelligence**. It analyzes a company announcement or business article, detects warehouse and fulfilment expansion signals, assigns an explainable buying-intent score, recommends a relevant supply-chain solution, and prepares personalized outreach.

The key distinction is that the agent does not rely only on static ICP filters. It identifies companies entering an active buying window based on business events. The MVP demonstrates the full agency loop: observe a signal, reason about relevance, prioritize the opportunity, recommend an action, and create an execution-ready output.

---

## 17. Demo Talk Track

> Our product vision is an AI GTM Operating System made of specialized, lightweight agents. Today we are demonstrating its first module: an ICP Discovery Agent for warehouse expansion intelligence.
>
> A sales team provides the solution it sells and a company announcement. The agent identifies verified expansion signals, calculates an explainable intent score, recommends the most relevant solution and buyer role, and creates contextual outreach.
>
> Traditional databases tell us whether a company fits an ICP. Our agent tells us whether the company may be entering a buying window now and what action the sales team should take next.

---

## 18. Future Roadmap

After the buildathon, this module can connect with additional GTM OS agents:

- Market Intelligence Agent
- Competitor Intelligence Agent
- Hiring Signal Agent
- Tender and RFP Agent
- Content and Campaign Agent
- CRM Follow-up Agent
- Revenue Optimization Agent

The ICP Discovery Agent can also become an API service that accepts company-event content and returns expansion signals, scores, recommendations, and outreach for use inside CRM and sales platforms.
