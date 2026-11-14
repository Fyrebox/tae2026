// A shift on the cardiac ward: the Session 3 workplace game for a cardiac nurse (taegordon.au/cardiacnurse).
// Same engine and tags as hairdresser.ink:
//   # manager:happy / # patient:worried   who speaks, and their face (happy, worried, thinking, surprised)
//   # scene:station / bedside / office    the background
//   # level:Name   # clock:9:00 am        the level title and the time of day
//   # good / # bad                        a right or wrong answer
//   # show:policy / cards / compare / pitch   opens that panel
// Lines with no speaker are the narrator. Every question counts once: a first-try right answer adds to the score.

VAR score = 0
VAR total = 0
VAR ai_goal = ""
VAR ai_risk = ""
VAR ml_goal = ""
VAR ml_risk = ""
VAR dl_goal = ""
VAR dl_risk = ""
VAR start = ""
VAR start_why = ""
VAR start_fix = ""
VAR feedback = ""
VAR change = ""

-> handover

=== function right(f) ===
{ f:
    ~ score++
}

=== handover ===
Ward 4B, cardiology, Corio Bay Hospital. It's 9 am. You're a cardiac nurse, and everyone asks you about computers and apps. # scene:station # clock:9:00 am # level:Morning handover
Morning. Have you got a minute after handover? # manager:happy
I've got three problems on this ward, and I want your help. # manager:worried
One: discharge instructions take us about 40 minutes a patient, and people still go home confused about their medicines. # manager:worried
Two: overnight, a patient can slowly get worse between observation rounds, and we spot it late. # manager:worried
Three: patients ring us after going home, worried about palpitations, and we can't tell over the phone what's going on. # manager:worried
The hospital has a small innovation fund. Find me one AI idea we can start next month. # manager:thinking
The budget is $5,000 to set up and $300 a month. # manager:thinking
I'm in meetings all week, so you'll get one minute on Friday. # manager:happy
First, read the hospital's AI rules. They're in your notes too. # manager:thinking # show:policy
* [Got it]
- -> spot

=== spot ===
Quick warm-up. What kind of tool is each one? # manager:happy # level:Spot it # clock:9:30 am
~ temp first = true
~ total++
- (q1)
"The infusion pump alarms when the line is blocked." # manager:thinking
* [A fixed rule]
    ~ right(first)
    Yes! A person set the rule: if the pressure goes over a limit, it alarms. Same input, same output. # manager:happy # good
* [AI that works with text]
    ~ first = false
    Not quite. It doesn't write anything: it follows a rule someone set. Try again. # manager:thinking # bad
    -> q1
* [ML: predicts from past data]
    ~ first = false
    Not quite. It doesn't learn or predict: it alarms when a limit is passed. Try again. # manager:thinking # bad
    -> q1
* [DL: pictures or sound]
    ~ first = false
    Not quite. It just measures pressure against a set limit. Try again. # manager:thinking # bad
    -> q1
- ~ first = true
~ total++
- (q2)
"A tool that writes a plain-English summary of a patient's discharge plan." # manager:thinking
* [A fixed rule]
    ~ first = false
    Not quite. It writes new text for each patient, so nobody wrote the steps. Try again. # manager:thinking # bad
    -> q2
* [AI that works with text]
    ~ right(first)
    Yes! It writes text, like Copilot or ChatGPT. That's an AI assistant (an LLM). # manager:happy # good
* [ML: predicts from past data]
    ~ first = false
    Close, but its job is writing words. That makes it an AI assistant that works with text. Try again. # manager:thinking # bad
    -> q2
* [DL: pictures or sound]
    ~ first = false
    Not quite. It works with words, not pictures or sound. Try again. # manager:thinking # bad
    -> q2
- ~ first = true
~ total++
- (q3)
"A tool that learns from years of vital signs which patients might get worse tonight." # manager:thinking
* [A fixed rule]
    ~ first = false
    Not quite. It learns from past patients: nobody wrote the steps. Try again. # manager:thinking # bad
    -> q3
* [AI that works with text]
    ~ first = false
    Not quite. It doesn't write anything: it makes a prediction. Try again. # manager:thinking # bad
    -> q3
* [ML: predicts from past data]
    ~ right(first)
    Yes! It learns patterns from past data and predicts. That's machine learning. # manager:happy # good
* [DL: pictures or sound]
    ~ first = false
    Not quite. It uses numbers like heart rate and blood pressure, not pictures or sound. Try again. # manager:thinking # bad
    -> q3
- ~ first = true
~ total++
- (q4)
"An app that reads a 30-second ECG and flags a possible irregular rhythm." # manager:thinking
* [A fixed rule]
    ~ first = false
    Not quite. Nobody could write rules for every heart trace. Try again. # manager:thinking # bad
    -> q4
* [AI that works with text]
    ~ first = false
    Not quite. It reads a heart trace, not text. Try again. # manager:thinking # bad
    -> q4
* [ML: predicts from past data]
    ~ first = false
    Close: it did learn from examples, but it reads the ECG trace like a picture. That's deep learning. Try again. # manager:thinking # bad
    -> q4
* [DL: pictures or sound]
    ~ right(first)
    Yes! It reads the ECG trace like a picture, so it's deep learning. # manager:happy # good
- -> options

=== options ===
I've asked around. Here are three ideas, one of each kind. # manager:happy # scene:office # clock:10:00 am # level:Meet the options # show:cards
* [I've read the three cards]
- Now let's compare them properly. # manager:thinking
-> compare

=== compare ===
Which of my three problems does the Discharge helper solve? # manager:thinking # level:Compare # clock:11:00 am
~ temp first = true
~ total++
- (c1)
* [Discharge instructions that take too long and still confuse patients]
    ~ right(first)
    ~ ai_goal = "Faster, clearer discharge instructions"
    Right. It drafts them, and we check them. # manager:happy # good
* [Patients getting worse overnight]
    ~ first = false
    No, that's the job of the Early-warning predictor. # manager:thinking # bad
    -> c1
* [Worried patients ringing about palpitations]
    ~ first = false
    No, that's what the Home ECG checker is for. # manager:thinking # bad
    -> c1
- ~ first = true
~ total++
And its main risk? # manager:thinking
- (c2)
* [It can write a confident wrong answer, like a wrong dose]
    ~ right(first)
    ~ ai_risk = "Can write a confident wrong answer, such as a wrong dose"
    Exactly. That's why a nurse checks every line against the chart. # manager:happy # good
* [It needs years of vital signs to learn from]
    ~ first = false
    No. It works from the nurse's notes. That's the ML one. # manager:thinking # bad
    -> c2
* [It must be approved as a device that reads ECGs]
    ~ first = false
    No, it never reads an ECG. That's the Home ECG checker. # manager:thinking # bad
    -> c2
- ~ first = true
~ total++
Next, the Early-warning predictor. Which problem does it solve? # manager:thinking
- (c3)
* [Patients getting worse overnight]
    ~ right(first)
    ~ ml_goal = "Patients who are getting worse are spotted sooner"
    Right. It flags who to check first. # manager:happy # good
* [Discharge instructions that take too long and still confuse patients]
    ~ first = false
    No, that's the Discharge helper. # manager:thinking # bad
    -> c3
* [Worried patients ringing about palpitations]
    ~ first = false
    No, that's the Home ECG checker. # manager:thinking # bad
    -> c3
- ~ first = true
~ total++
And its main risk? # manager:thinking
- (c4)
* [It can miss a patient or raise false alarms]
    ~ right(first)
    ~ ml_risk = "Can miss a patient or raise false alarms: it's a prediction, not a diagnosis"
    Yes. Too many false alarms and nurses stop listening. Miss one and we feel safe when we shouldn't. # manager:happy # good
* [It can write the wrong dose in a letter]
    ~ first = false
    No, it doesn't write letters. That's the Discharge helper. # manager:thinking # bad
    -> c4
* [It needs patients to record an ECG at home]
    ~ first = false
    No, it uses the observations we already take. That's the Home ECG checker. # manager:thinking # bad
    -> c4
- ~ first = true
~ total++
Last, the Home ECG checker. Which problem does it solve? # manager:thinking
- (c5)
* [Worried patients ringing about palpitations]
    ~ right(first)
    ~ dl_goal = "Patients at home can send an ECG when they feel palpitations"
    Right. They record an ECG, and we can see what's going on. # manager:happy # good
* [Patients getting worse overnight]
    ~ first = false
    No, that's the Early-warning predictor. # manager:thinking # bad
    -> c5
* [Discharge instructions that take too long and still confuse patients]
    ~ first = false
    No, that's the Discharge helper. # manager:thinking # bad
    -> c5
- ~ first = true
~ total++
And its main risk? # manager:thinking
- (c6)
* [It's a medical device: it needs TGA approval, and a clinician confirms every result]
    ~ right(first)
    ~ dl_risk = "A medical device: needs TGA approval, and a clinician must confirm every result"
    Exactly. It suggests a rhythm; a clinician decides. # manager:happy # good
* [It needs years of vital signs to learn from]
    ~ first = false
    No, it reads each ECG as it comes. That's the ML one. # manager:thinking # bad
    -> c6
* [It can write the wrong dose in a letter]
    ~ first = false
    No, it doesn't write letters. That's the Discharge helper. # manager:thinking # bad
    -> c6
- ~ first = true
~ total++
Which one needs years of past records to learn from? # manager:thinking
- (c7)
* [The Early-warning predictor]
    ~ right(first)
    Yes. Luckily the hospital has eight years of observations. # manager:happy # good
* [The Discharge helper]
    ~ first = false
    No. It works from the nurse's notes for each patient. # manager:thinking # bad
    -> c7
* [The Home ECG checker]
    ~ first = false
    No. It reads each ECG as it's sent. # manager:thinking # bad
    -> c7
- ~ first = true
~ total++
Here's your comparison so far. Can we afford all three? # manager:thinking # show:compare
- (c8)
* [No: $7,500 to set up and $510 a month is over budget]
    ~ right(first)
    Right. We have $5,000 and $300 a month, so we have to choose. # manager:worried # good
* [Yes, just]
    ~ first = false
    Add them up: $500 + $3,000 + $4,000 to set up, and $60 + $200 + $250 a month. # manager:thinking # bad
    -> c8
* [Yes, if the hospital pays the monthly fees]
    ~ first = false
    The fund covers the monthly fees too. That's the $300. # manager:thinking # bad
    -> c8
- -> first_pick

=== first_pick ===
So, which one would you start with? # manager:thinking # level:Which first? # clock:12:00 pm
~ temp first = true
~ total++
- (p1)
* [The Discharge helper]
    ~ right(first)
    ~ start = "ai"
    Good choice: cheap and quick to start. # manager:happy # good
    -> why_ai
* [The Early-warning predictor]
    ~ right(first)
    ~ start = "ml"
    Good choice: that's our most serious problem. # manager:happy # good
    -> why_ml
* [The Home ECG checker]
    ~ first = false
    It's the most expensive, and as a medical device it needs the most approvals. Start smaller, and we can add it later. # manager:worried # bad
    -> p1

= why_ai
~ temp first = true
~ total++
Tell me why, in one line. # manager:thinking
- (w1)
* [It's cheap, quick to start, and gives nurses back time with patients]
    ~ right(first)
    ~ start_why = "It's cheap and quick to start ($500 and $60 a month), it gives nurses back about 40 minutes a discharge, and patients go home with clearer instructions."
    That's a reason I can take to the director of nursing. # manager:happy # good
* [It never makes mistakes]
    ~ first = false
    It does make mistakes. That's its main risk. # manager:worried # bad
    -> w1
* [It spots patients getting worse]
    ~ first = false
    That's the Early-warning predictor's job. # manager:thinking # bad
    -> w1
- ~ first = true
~ total++
How would you manage its main risk? # manager:thinking
- (f1)
* [A nurse checks every line against the medication chart before it goes to the patient]
    ~ right(first)
    ~ start_fix = "A nurse checks every line against the medication chart before it goes to the patient (rule 2)."
    Yes. AI suggests, clinicians decide: that's rule 2. # manager:happy # good
* [Print it straight from the tool to save time]
    ~ first = false
    Then nobody checks the doses. That breaks rule 2. # manager:worried # bad
    -> f1
* [Use free ChatGPT, it writes better]
    ~ first = false
    Patient notes never go into public tools. That breaks rule 1. # manager:worried # bad
    -> f1
- -> policy

= why_ml
~ temp first = true
~ total++
Tell me why, in one line. # manager:thinking
- (w2)
* [It tackles our most serious problem, and it fits the budget]
    ~ right(first)
    ~ start_why = "It tackles our most serious problem, patients getting worse overnight, and it fits the budget ($3,000 and $200 a month)."
    That's a reason I can take to the director of nursing. # manager:happy # good
* [It's the cheapest]
    ~ first = false
    The Discharge helper is cheaper. Try again. # manager:thinking # bad
    -> w2
* [It means we can do fewer observation rounds]
    ~ first = false
    No! It's an extra safety net, not a replacement for our observations. # manager:worried # bad
    -> w2
- ~ first = true
~ total++
How would you manage its main risk? # manager:thinking
- (f2)
* [Nurses still do their checks: the alert is a prompt, not a diagnosis, and we track how often it's wrong]
    ~ right(first)
    ~ start_fix = "Nurses still do their observations and use their judgement: the alert is a prompt, not a diagnosis, and we track how often it's wrong."
    Yes. It suggests, we decide. # manager:happy # good
* [Turn the alerts off at night, when the ward is quiet]
    ~ first = false
    Night is exactly when we need it! # manager:surprised # bad
    -> f2
* [Let it decide who gets a doctor]
    ~ first = false
    Never. AI suggests, clinicians decide: rule 2. # manager:worried # bad
    -> f2
- -> policy

=== policy ===
After lunch, you're looking after Ray, 68, who had a stent put in yesterday and goes home tomorrow. # scene:bedside # clock:1:00 pm # level:Policy problems
Can you put my test results into ChatGPT on your phone? I want them in plain English. # patient:happy
~ temp first = true
~ total++
- (r1)
What do you do? # patient:happy
* [Explain them yourself, and use only the hospital's approved tool if you need help]
    ~ right(first)
    That's even better, thanks. I'd rather hear it from you. # patient:happy # good
* [Paste them into ChatGPT, but leave his name off]
    ~ first = false
    Even without his name, health details don't go into public tools. Rule 1. # manager:worried # bad
    -> r1
* [Paste them in: it's his own data, so it's fine]
    ~ first = false
    Your phone's ChatGPT isn't an approved tool, and it's still health information. Rule 1. # manager:worried # bad
    -> r1
- ~ first = true
~ total++
Later, the Discharge helper drafts Ray's instructions: "Take metoprolol 500 mg twice a day." The chart says 50 mg. # manager:surprised
- (r2)
* [Fix it, and check every dose against the chart before Ray gets it]
    ~ right(first)
    Good catch. That's exactly why we have rule 2. # manager:happy # good
* [Print it: the AI read the notes, so it must be right]
    ~ first = false
    It sounded sure and it was ten times too much. A nurse checks every line. # manager:worried # bad
    -> r2
* [Stop using AI for anything]
    ~ first = false
    That's a bit much. Checking every line fixes it. # manager:thinking # bad
    -> r2
- ~ first = true
~ total++
One more. A company is offering a free trial of an app that reads ECGs on patients' phones. Can we start it tomorrow? # manager:thinking
- (r3)
* [Not yet: check it's approved by the TGA, and get clinical governance approval first]
    ~ right(first)
    Glad you said that. Free doesn't mean safe. Rule 3. # manager:happy # good
* [Yes, it's free]
    ~ first = false
    Free isn't the question. Is it approved to diagnose? Rule 3. # manager:worried # bad
    -> r3
* [Yes, if patients sign a form]
    ~ first = false
    A form doesn't make an unapproved device safe. Rule 3. # manager:worried # bad
    -> r3
- -> pitch

=== pitch ===
Friday's nearly here. Let's build your one-minute pitch: put the four moves in order. # manager:happy # scene:office # clock:3:00 pm # level:Build your pitch
~ temp first = true
~ total++
- (m1)
What do you say first? # manager:thinking
* [The problem we're solving]
    ~ right(first)
    Yes: start with my problem, so I'm listening. # manager:happy # good
* [My recommendation and why]
    ~ first = false
    Say what problem it solves first, so I know why I should care. # manager:thinking # bad
    -> m1
* [The main risk and how we manage it]
    ~ first = false
    Don't open with the risk: start with my problem. # manager:thinking # bad
    -> m1
* [Ask: "What would you change?"]
    ~ first = false
    That's how you finish, not how you start. # manager:thinking # bad
    -> m1
- ~ first = true
~ total++
- (m2)
And second? # manager:thinking
* [My recommendation and why]
    ~ right(first)
    Yes: problem, then your idea. # manager:happy # good
* [The main risk and how we manage it]
    ~ first = false
    Tell me your idea before its risk. # manager:thinking # bad
    -> m2
* [Ask: "What would you change?"]
    ~ first = false
    Not yet: I haven't heard your idea. # manager:thinking # bad
    -> m2
- ~ first = true
~ total++
- (m3)
Third? # manager:thinking
* [The main risk and how we manage it]
    ~ right(first)
    Yes. Being honest about the risk makes me trust you. # manager:happy # good
* [Ask: "What would you change?"]
    ~ first = false
    Not yet. Tell me the risk first, honestly. # manager:thinking # bad
    -> m3
- Then finish with: "What would you change?" Here's your script. # manager:happy # show:pitch
* [Next]
- -> real_pitch

=== real_pitch ===
Now pitch for real. Your trainer is playing the Nurse Unit Manager. Keep your script open if you need it. # level:Pitch the manager # clock:3:30 pm # show:pitch
* [I've pitched to the manager]
- -> manager_feedback

=== manager_feedback ===
That was clear. What did the manager ask you to change? # manager:thinking # level:Manager's feedback # clock:4:00 pm
* [Start with a short trial first]
    ~ feedback = "Start with a short trial first."
    ~ change = "We trial it on Ward 4B for 3 months, then review the results with the clinical governance committee before we keep it."
* [Say how we keep patient information safe]
    ~ feedback = "Say how we keep patient information safe."
    ~ change = "We use only the hospital's approved, secure version, and patient information never leaves the hospital's systems."
* [Explain the monthly cost]
    ~ feedback = "Explain the monthly cost."
    { start == "ml":
        ~ change = "The total cost is $3,000 to set up and $200 a month, inside the $5,000 and $300 a month budget."
    - else:
        ~ change = "The total cost is $500 to set up and $60 a month, inside the $5,000 and $300 a month budget."
    }
* [Say who checks it, and how often]
    ~ feedback = "Say who checks it, and how often."
    ~ change = "The nurse in charge checks it every shift and reports any problem to the Nurse Unit Manager."
- Writing it down isn't enough: change your recommendation. # manager:thinking
* [Update my recommendation]
    Done. It now says: "{change}" # manager:happy # good
- Send me the final version before you go home. # manager:happy # level:Send it # clock:5:00 pm
-> END
