// A day on the building site: the Session 3 workplace game for a construction worker (taegordon.au/constructionworker).
// Same engine and tags as hairdresser.ink:
//   # supervisor:happy / # apprentice:worried   who speaks, and their face (happy, worried, thinking, surprised)
//   # scene:site / shed                          the background
//   # level:Name   # clock:7:00 am               the level title and the time of day
//   # good / # bad                               a right or wrong answer
//   # show:policy / cards / compare / pitch      opens that panel
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

-> prestart

=== function right(f) ===
{ f:
    ~ score++
}

=== prestart ===
Bayline Builders, a new housing estate in Armstrong Creek. It's 7 am, and the pre-start meeting has just finished. You're the one everyone asks about phones, tablets and apps. # scene:site # clock:7:00 am # level:Pre-start
Morning! Hang back a minute, would you? # supervisor:happy
I've got three problems on this site, and I want your help. # supervisor:worried
One: rain and late deliveries keep pushing us behind, and every day late costs about $1,500. # supervisor:worried
Two: I spend about an hour after every shift writing SWMS, toolbox talks and the site diary. # supervisor:worried
Three: we keep having near misses. People without a hard hat, or too close to an open edge. # supervisor:worried
The boss says there's money for AI. Find me one idea we can start next month. # supervisor:thinking
The budget is $6,000 to set up and $400 a month. # supervisor:thinking
I'll have one minute on Friday, between the concrete pour and the inspector. # supervisor:happy
First, read the company's AI rules. They're in your notes too. # supervisor:thinking # show:policy
* [Got it]
- -> spot

=== spot ===
Quick warm-up. What kind of tool is each one? # supervisor:happy # level:Spot it # clock:7:30 am
~ temp first = true
~ total++
- (q1)
"The crane's load alarm sounds when the load is over the safe limit." # supervisor:thinking
* [A fixed rule]
    ~ right(first)
    Yes! A person set the limit: over it, the alarm sounds. Same input, same output. # supervisor:happy # good
* [AI that works with text]
    ~ first = false
    Not quite. It doesn't write anything: it follows a limit someone set. Try again. # supervisor:thinking # bad
    -> q1
* [ML: predicts from past data]
    ~ first = false
    Not quite. It doesn't learn or predict: it alarms when a limit is passed. Try again. # supervisor:thinking # bad
    -> q1
* [DL: pictures or sound]
    ~ first = false
    Not quite. It just weighs the load against a set limit. Try again. # supervisor:thinking # bad
    -> q1
- ~ first = true
~ total++
- (q2)
"A tool that writes a toolbox talk from my notes." # supervisor:thinking
* [A fixed rule]
    ~ first = false
    Not quite. It writes new text each time, so nobody wrote the steps. Try again. # supervisor:thinking # bad
    -> q2
* [AI that works with text]
    ~ right(first)
    Yes! It writes text, like ChatGPT or Copilot. That's an AI assistant (an LLM). # supervisor:happy # good
* [ML: predicts from past data]
    ~ first = false
    Close, but its job is writing words. That makes it an AI assistant that works with text. Try again. # supervisor:thinking # bad
    -> q2
* [DL: pictures or sound]
    ~ first = false
    Not quite. It works with words, not pictures or sound. Try again. # supervisor:thinking # bad
    -> q2
- ~ first = true
~ total++
- (q3)
"A tool that learns from six years of past jobs and the weather which tasks will run late." # supervisor:thinking
* [A fixed rule]
    ~ first = false
    Not quite. It learns from past jobs: nobody wrote the steps. Try again. # supervisor:thinking # bad
    -> q3
* [AI that works with text]
    ~ first = false
    Not quite. It doesn't write anything: it makes a prediction. Try again. # supervisor:thinking # bad
    -> q3
* [ML: predicts from past data]
    ~ right(first)
    Yes! It learns patterns from past data and predicts. That's machine learning. # supervisor:happy # good
* [DL: pictures or sound]
    ~ first = false
    Not quite. It uses dates, deliveries and rainfall, not pictures or sound. Try again. # supervisor:thinking # bad
    -> q3
- ~ first = true
~ total++
- (q4)
"A camera that spots people on site without a hard hat." # supervisor:thinking
* [A fixed rule]
    ~ first = false
    Not quite. Nobody could write rules for every person, angle and hat. Try again. # supervisor:thinking # bad
    -> q4
* [AI that works with text]
    ~ first = false
    Not quite. It works with video, not text. Try again. # supervisor:thinking # bad
    -> q4
* [ML: predicts from past data]
    ~ first = false
    Close: it did learn from examples, but it works with pictures. That's deep learning. Try again. # supervisor:thinking # bad
    -> q4
* [DL: pictures or sound]
    ~ right(first)
    Yes! It works with pictures, so it's deep learning. # supervisor:happy # good
- -> options

=== options ===
I asked around. Here are three ideas, one of each kind. # supervisor:happy # scene:shed # clock:8:00 am # level:Meet the options # show:cards
* [I've read the three cards]
- Now let's compare them properly. # supervisor:thinking
-> compare

=== compare ===
Which of my three problems does the Safety paperwork helper solve? # supervisor:thinking # level:Compare # clock:9:00 am
~ temp first = true
~ total++
- (c1)
* [The hour of paperwork after every shift]
    ~ right(first)
    ~ ai_goal = "Cuts the hour of SWMS, toolbox talk and diary writing after every shift"
    Right. It drafts the paperwork, and I check and sign it. # supervisor:happy # good
* [Delays from rain and late deliveries]
    ~ first = false
    No, that's the job of the Delay predictor. # supervisor:thinking # bad
    -> c1
* [Near misses on site]
    ~ first = false
    No, that's what the Site safety camera is for. # supervisor:thinking # bad
    -> c1
- ~ first = true
~ total++
And its main risk? # supervisor:thinking
- (c2)
* [It can write a confident but wrong safety step, or miss a hazard]
    ~ right(first)
    ~ ai_risk = "Can write a confident but wrong safety step, or miss a hazard"
    Exactly. That's why a competent person checks and signs every SWMS. # supervisor:happy # good
* [It needs years of past jobs to learn from]
    ~ first = false
    No. It works from my notes and our templates. That's the ML one. # supervisor:thinking # bad
    -> c2
* [It films workers on site]
    ~ first = false
    No, it never sees the site. That's the Site safety camera. # supervisor:thinking # bad
    -> c2
- ~ first = true
~ total++
Next, the Delay predictor. Which problem does it solve? # supervisor:thinking
- (c3)
* [Delays from rain and late deliveries]
    ~ right(first)
    ~ ml_goal = "Warns us which tasks will run late, so we can plan around them"
    Right. It tells us what's likely to slip, before it does. # supervisor:happy # good
* [The hour of paperwork after every shift]
    ~ first = false
    No, that's the Safety paperwork helper. # supervisor:thinking # bad
    -> c3
* [Near misses on site]
    ~ first = false
    No, that's the Site safety camera. # supervisor:thinking # bad
    -> c3
- ~ first = true
~ total++
And its main risk? # supervisor:thinking
- (c4)
* [Something it has never seen, like a supplier going broke, can make it wrong]
    ~ right(first)
    ~ ml_risk = "Something it has never seen, like a supplier going broke, can make it wrong"
    Yes. It only knows what's happened before. # supervisor:happy # good
* [It can write a wrong safety step]
    ~ first = false
    No, it doesn't write anything. That's the Safety paperwork helper. # supervisor:thinking # bad
    -> c4
* [It films workers on site]
    ~ first = false
    No, it uses schedules and weather. That's the Site safety camera. # supervisor:thinking # bad
    -> c4
- ~ first = true
~ total++
Last, the Site safety camera. Which problem does it solve? # supervisor:thinking
- (c5)
* [Near misses on site]
    ~ right(first)
    ~ dl_goal = "Spots missing hard hats or hi-vis, and people near open edges"
    Right. It sends me an alert straight away. # supervisor:happy # good
* [Delays from rain and late deliveries]
    ~ first = false
    No, that's the Delay predictor. # supervisor:thinking # bad
    -> c5
* [The hour of paperwork after every shift]
    ~ first = false
    No, that's the Safety paperwork helper. # supervisor:thinking # bad
    -> c5
- ~ first = true
~ total++
And its main risk? # supervisor:thinking
- (c6)
* [It films workers, so they must be told in writing, and it can miss things]
    ~ right(first)
    ~ dl_risk = "Films workers, so they must be told in writing; and it can miss things, so it never replaces a person watching"
    Exactly. It helps us look, but people still keep each other safe. # supervisor:happy # good
* [It needs years of past jobs to learn from]
    ~ first = false
    No, it looks at the site as it is right now. That's the ML one. # supervisor:thinking # bad
    -> c6
* [It can write a wrong safety step]
    ~ first = false
    No, it doesn't write anything. That's the Safety paperwork helper. # supervisor:thinking # bad
    -> c6
- ~ first = true
~ total++
Which one needs years of past records to learn from? # supervisor:thinking
- (c7)
* [The Delay predictor]
    ~ right(first)
    Yes. Luckily we have six years of job records. # supervisor:happy # good
* [The Safety paperwork helper]
    ~ first = false
    No. It needs my notes and our templates, not years of records. # supervisor:thinking # bad
    -> c7
* [The Site safety camera]
    ~ first = false
    No. It looks at the site as it is right now. # supervisor:thinking # bad
    -> c7
- ~ first = true
~ total++
Here's your comparison so far. Can we afford all three? # supervisor:thinking # show:compare
- (c8)
* [No: $7,100 to set up and $495 a month is over budget]
    ~ right(first)
    Right. We have $6,000 and $400 a month, so we have to choose. # supervisor:worried # good
* [Yes, just]
    ~ first = false
    Add them up: $100 + $2,000 + $5,000 to set up, and $45 + $150 + $300 a month. # supervisor:thinking # bad
    -> c8
* [Yes, if we skip the monthly fees]
    ~ first = false
    We can't skip them: the tools stop working. # supervisor:thinking # bad
    -> c8
- -> first_pick

=== first_pick ===
So, which one would you start with? # supervisor:thinking # level:Which first? # clock:10:00 am
~ temp first = true
~ total++
- (p1)
* [The Safety paperwork helper]
    ~ right(first)
    ~ start = "ai"
    Good choice: cheap and quick to start. # supervisor:happy # good
    -> why_ai
* [The Delay predictor]
    ~ right(first)
    ~ start = "ml"
    Good choice: that's our most expensive problem. # supervisor:happy # good
    -> why_ml
* [The Site safety camera]
    ~ first = false
    It's the most expensive and the hardest to set up. Start smaller, and we can add it later. # supervisor:worried # bad
    -> p1

= why_ai
~ temp first = true
~ total++
Tell me why, in one line. # supervisor:thinking
- (w1)
* [It's cheap, quick to start, and gives back the hour of paperwork after each shift]
    ~ right(first)
    ~ start_why = "It's cheap and quick to start ($100 and $45 a month), and it gives the supervisor back about an hour of paperwork after every shift."
    That's a reason I can take to the boss. # supervisor:happy # good
* [It never makes mistakes]
    ~ first = false
    It does make mistakes, and in a SWMS that's dangerous. # supervisor:worried # bad
    -> w1
* [It stops near misses]
    ~ first = false
    That's the Site safety camera's job. # supervisor:thinking # bad
    -> w1
- ~ first = true
~ total++
How would you manage its main risk? # supervisor:thinking
- (f1)
* [The supervisor checks and signs every SWMS before work starts]
    ~ right(first)
    ~ start_fix = "The supervisor checks and signs every SWMS and toolbox talk before work starts (AI rule 1)."
    Yes. AI drafts, a person approves: rule 1. # supervisor:happy # good
* [Let it approve the SWMS, so work starts sooner]
    ~ first = false
    Never. A competent person signs every SWMS. Rule 1. # supervisor:worried # bad
    -> f1
* [Copy the last job's SWMS without changes]
    ~ first = false
    Every site and every job has different hazards. # supervisor:worried # bad
    -> f1
- -> policy

= why_ml
~ temp first = true
~ total++
Tell me why, in one line. # supervisor:thinking
- (w2)
* [It tackles our most expensive problem: about $1,500 a day late]
    ~ right(first)
    ~ start_why = "It tackles our most expensive problem: every day late costs about $1,500, and it fits the budget ($2,000 and $150 a month)."
    That's a reason I can take to the boss. # supervisor:happy # good
* [It's the cheapest]
    ~ first = false
    The Safety paperwork helper is cheaper. Try again. # supervisor:thinking # bad
    -> w2
* [It needs no data]
    ~ first = false
    It needs years of job records. Luckily, we have them. # supervisor:thinking # bad
    -> w2
- ~ first = true
~ total++
How would you manage its main risk? # supervisor:thinking
- (f2)
* [The supervisor checks its warnings each week, and we compare them with what really happened]
    ~ right(first)
    ~ start_fix = "The supervisor checks its warnings each week and plans around them, and we compare them with what really happened."
    Yes. It warns, we decide. # supervisor:happy # good
* [Move the whole schedule whenever it says "late"]
    ~ first = false
    Then we'd be chasing every guess. It warns, we decide. # supervisor:worried # bad
    -> f2
* [Stop recording delays, so it looks better]
    ~ first = false
    Delays are what it learns from! # supervisor:surprised # bad
    -> f2
- -> policy

=== policy ===
Lunch break. Kai, the first-year apprentice, comes over with his phone. # scene:site # clock:12:00 pm # level:Policy problems
I took photos of the client's plans and the lockbox code. Can I put them in free ChatGPT to make the materials list? # apprentice:happy
~ temp first = true
~ total++
- (r1)
What do you tell Kai? # apprentice:happy
* [No: client and site details only go into the company's approved tool]
    ~ right(first)
    Fair enough. I'll use the company one. Thanks! # apprentice:happy # good
* [Yes, if you crop out the address]
    ~ first = false
    The plans and the lockbox code are still client and site details. Rule 2. # supervisor:worried # bad
    -> r1
* [Yes, ChatGPT deletes it anyway]
    ~ first = false
    You can't be sure of that, and it's not an approved tool. Rule 2. # supervisor:worried # bad
    -> r1
- ~ first = true
~ total++
Later, the paperwork helper drafts the SWMS for tomorrow's roof work. It doesn't mention fall protection. # supervisor:surprised
- (r2)
* [Fix it: the supervisor checks and signs every SWMS before work starts]
    ~ right(first)
    Good catch. A missing hazard on a roof can kill someone. # supervisor:happy # good
* [Start work: the AI knows how to write a SWMS]
    ~ first = false
    It sounded sure, and it missed the biggest hazard on a roof. # supervisor:worried # bad
    -> r2
* [Ban AI from the company]
    ~ first = false
    That's a bit much. Checking and signing fixes it. # supervisor:thinking # bad
    -> r2
- ~ first = true
~ total++
One more. The camera company says it could also recognise each worker's face, to see who takes long breaks. Good idea? # supervisor:thinking
- (r3)
* [No: the cameras are for safety, and watching individual workers breaks our rule]
    ~ right(first)
    Glad you said that. Rule 3, and the crew would never trust us again. # supervisor:happy # good
* [Yes, if we don't tell the crew]
    ~ first = false
    Secret watching breaks rule 3 and the law. # supervisor:worried # bad
    -> r3
* [Yes, everyone's on camera anyway]
    ~ first = false
    They agreed to safety cameras, not to being watched. Rule 3. # supervisor:worried # bad
    -> r3
- -> pitch

=== pitch ===
Friday's nearly here. Let's build your one-minute pitch: put the four moves in order. # supervisor:happy # scene:shed # clock:2:00 pm # level:Build your pitch
~ temp first = true
~ total++
- (m1)
What do you say first? # supervisor:thinking
* [The problem we're solving]
    ~ right(first)
    Yes: start with my problem, so I'm listening. # supervisor:happy # good
* [My recommendation and why]
    ~ first = false
    Say what problem it solves first, so I know why I should care. # supervisor:thinking # bad
    -> m1
* [The main risk and how we manage it]
    ~ first = false
    Don't open with the risk: start with my problem. # supervisor:thinking # bad
    -> m1
* [Ask: "What would you change?"]
    ~ first = false
    That's how you finish, not how you start. # supervisor:thinking # bad
    -> m1
- ~ first = true
~ total++
- (m2)
And second? # supervisor:thinking
* [My recommendation and why]
    ~ right(first)
    Yes: problem, then your idea. # supervisor:happy # good
* [The main risk and how we manage it]
    ~ first = false
    Tell me your idea before its risk. # supervisor:thinking # bad
    -> m2
* [Ask: "What would you change?"]
    ~ first = false
    Not yet: I haven't heard your idea. # supervisor:thinking # bad
    -> m2
- ~ first = true
~ total++
- (m3)
Third? # supervisor:thinking
* [The main risk and how we manage it]
    ~ right(first)
    Yes. Being honest about the risk makes me trust you. # supervisor:happy # good
* [Ask: "What would you change?"]
    ~ first = false
    Not yet. Tell me the risk first, honestly. # supervisor:thinking # bad
    -> m3
- Then finish with: "What would you change?" Here's your script. # supervisor:happy # show:pitch
* [Next]
- -> real_pitch

=== real_pitch ===
Now pitch for real. Your trainer is playing the site supervisor. Keep your script open if you need it. # level:Pitch the supervisor # clock:2:30 pm # show:pitch
* [I've pitched to the supervisor]
- -> supervisor_feedback

=== supervisor_feedback ===
Good pitch. What did the supervisor ask you to change? # supervisor:thinking # level:Supervisor's feedback # clock:3:00 pm
* [Start with a short trial first]
    ~ feedback = "Start with a short trial first."
    ~ change = "We trial it on this site for 3 months, then review the results before we use it on other sites."
* [Say how we keep worker and client details safe]
    ~ feedback = "Say how we keep worker and client details safe."
    ~ change = "Worker, client and site details stay in our approved systems and never go into free AI tools."
* [Explain the monthly cost]
    ~ feedback = "Explain the monthly cost."
    { start == "ml":
        ~ change = "The total cost is $2,000 to set up and $150 a month, inside the $6,000 and $400 a month budget."
    - else:
        ~ change = "The total cost is $100 to set up and $45 a month, inside the $6,000 and $400 a month budget."
    }
* [Say who checks it, and how often]
    ~ feedback = "Say who checks it, and how often."
    ~ change = "The leading hand checks it every day and reports any problem to the site supervisor."
- Writing it down isn't enough: change your recommendation. # supervisor:thinking
* [Update my recommendation]
    Done. It now says: "{change}" # supervisor:happy # good
- Send me the final version before knock-off. # supervisor:happy # level:Send it # clock:3:30 pm
-> END
