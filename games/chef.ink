// A day in the kitchen: the Session 3 workplace game for a chef (taegordon.au/chef).
// Same engine and tags as hairdresser.ink:
//   # owner:happy / # customer:worried   who speaks, and their face (happy, worried, thinking, surprised)
//   # scene:kitchen / dining / office     the background
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

-> prep

=== function right(f) ===
{ f:
    ~ score++
}

=== prep ===
The Pier Kitchen, on the Geelong waterfront. It's 9 am, and you're starting prep. You're also the one everyone asks about computers and apps. # scene:kitchen # clock:9:00 am # level:Morning prep
Morning, chef! Before the rush, can I borrow you? # owner:happy
I've got three problems, and I need your help. # owner:worried
One: some nights we prep for 120 and 70 turn up. We throw out about $800 of food a week. # owner:worried
Two: customers message all day about allergens and gluten-free options, and nobody has time to answer. # owner:worried
Three: we don't know which dishes come back half-eaten or end up in the bin. # owner:worried
Everyone's talking about AI. Find me one idea we can start next month. # owner:thinking
My budget is $4,000 to set up and $250 a month. # owner:thinking
On Friday I'll have one minute between deliveries to hear it. # owner:happy
First, read our AI rules. They're in your notes too. # owner:thinking # show:policy
* [Got it]
- -> spot

=== spot ===
Quick warm-up while you chop. What kind of tool is each one? # owner:happy # level:Spot it # clock:9:30 am
~ temp first = true
~ total++
- (q1)
"The cool room alarm beeps when it gets warmer than 5°C." # owner:thinking
* [A fixed rule]
    ~ right(first)
    Yes! A person set the limit: over 5°C, it beeps. Same input, same output. # owner:happy # good
* [AI that works with text]
    ~ first = false
    Not quite. It doesn't write anything: it follows a limit someone set. Try again. # owner:thinking # bad
    -> q1
* [ML: predicts from past data]
    ~ first = false
    Not quite. It doesn't learn or predict: it beeps when a limit is passed. Try again. # owner:thinking # bad
    -> q1
* [DL: pictures or sound]
    ~ first = false
    Not quite. It just measures temperature against a set limit. Try again. # owner:thinking # bad
    -> q1
- ~ first = true
~ total++
- (q2)
"A tool that writes menu descriptions for tonight's specials." # owner:thinking
* [A fixed rule]
    ~ first = false
    Not quite. It writes new words each time, so nobody wrote the steps. Try again. # owner:thinking # bad
    -> q2
* [AI that works with text]
    ~ right(first)
    Yes! It writes text, like ChatGPT or Copilot. That's an AI assistant (an LLM). # owner:happy # good
* [ML: predicts from past data]
    ~ first = false
    Close, but its job is writing words. That makes it an AI assistant that works with text. Try again. # owner:thinking # bad
    -> q2
* [DL: pictures or sound]
    ~ first = false
    Not quite. It works with words, not pictures or sound. Try again. # owner:thinking # bad
    -> q2
- ~ first = true
~ total++
- (q3)
"A tool that learns from three years of bookings and weather how many customers will come on Saturday." # owner:thinking
* [A fixed rule]
    ~ first = false
    Not quite. It learns from past bookings: nobody wrote the steps. Try again. # owner:thinking # bad
    -> q3
* [AI that works with text]
    ~ first = false
    Not quite. It doesn't write anything: it makes a prediction. Try again. # owner:thinking # bad
    -> q3
* [ML: predicts from past data]
    ~ right(first)
    Yes! It learns patterns from past data and predicts. That's machine learning. # owner:happy # good
* [DL: pictures or sound]
    ~ first = false
    Not quite. It uses numbers like bookings and temperatures, not pictures or sound. Try again. # owner:thinking # bad
    -> q3
- ~ first = true
~ total++
- (q4)
"A camera over the bin that recognises what food is thrown away." # owner:thinking
* [A fixed rule]
    ~ first = false
    Not quite. Nobody could write rules for every plate of food. Try again. # owner:thinking # bad
    -> q4
* [AI that works with text]
    ~ first = false
    Not quite. It works with pictures, not text. Try again. # owner:thinking # bad
    -> q4
* [ML: predicts from past data]
    ~ first = false
    Close: it did learn from examples, but it works with pictures. That's deep learning. Try again. # owner:thinking # bad
    -> q4
* [DL: pictures or sound]
    ~ right(first)
    Yes! It works with pictures, so it's deep learning. # owner:happy # good
- -> options

=== options ===
I asked around. Here are three ideas, one of each kind. # owner:happy # scene:office # clock:10:00 am # level:Meet the options # show:cards
* [I've read the three cards]
- Now let's compare them properly. # owner:thinking
-> compare

=== compare ===
Which of my three problems does the Menu and allergen helper solve? # owner:thinking # level:Compare # clock:11:00 am
~ temp first = true
~ total++
- (c1)
* [Allergen questions nobody has time to answer]
    ~ right(first)
    ~ ai_goal = "Answers customers' menu and allergen questions quickly"
    Right. It drafts the replies, and a chef checks them. # owner:happy # good
* [Food we throw out because we prep too much]
    ~ first = false
    No, that's the job of the Customer forecast. # owner:thinking # bad
    -> c1
* [Not knowing which dishes get thrown away]
    ~ first = false
    No, that's what the Bin camera is for. # owner:thinking # bad
    -> c1
- ~ first = true
~ total++
And its main risk? # owner:thinking
- (c2)
* [It can give a confident wrong answer about allergens, which could hurt someone]
    ~ right(first)
    ~ ai_risk = "Can give a confident wrong answer about allergens, which could hurt someone"
    Exactly. That's why a chef checks every allergen answer. # owner:happy # good
* [It needs years of bookings to learn from]
    ~ first = false
    No. It works from our menu and allergen chart. That's the ML one. # owner:thinking # bad
    -> c2
* [It films staff in the kitchen]
    ~ first = false
    No, it never sees the kitchen. That's the Bin camera. # owner:thinking # bad
    -> c2
- ~ first = true
~ total++
Next, the Customer forecast. Which problem does it solve? # owner:thinking
- (c3)
* [Food we throw out because we prep too much]
    ~ right(first)
    ~ ml_goal = "Prep the right amount, so less food is thrown out"
    Right. It tells us how many to prep for. # owner:happy # good
* [Allergen questions nobody has time to answer]
    ~ first = false
    No, that's the Menu and allergen helper. # owner:thinking # bad
    -> c3
* [Not knowing which dishes get thrown away]
    ~ first = false
    No, that's the Bin camera. # owner:thinking # bad
    -> c3
- ~ first = true
~ total++
And its main risk? # owner:thinking
- (c4)
* [A surprise, like a storm or a festival, can make the forecast wrong]
    ~ right(first)
    ~ ml_risk = "A surprise, like a storm or a festival, can make the forecast wrong"
    Yes. It only knows what's happened before. # owner:happy # good
* [It can make up allergen information]
    ~ first = false
    No, it doesn't write anything. That's the Menu and allergen helper. # owner:thinking # bad
    -> c4
* [It films staff in the kitchen]
    ~ first = false
    No, it uses bookings and sales. That's the Bin camera. # owner:thinking # bad
    -> c4
- ~ first = true
~ total++
Last, the Bin camera. Which problem does it solve? # owner:thinking
- (c5)
* [Not knowing which dishes get thrown away]
    ~ right(first)
    ~ dl_goal = "Shows which dishes get thrown away, so we can change portions and the menu"
    Right. It tells us what goes in the bin, and how much. # owner:happy # good
* [Food we throw out because we prep too much]
    ~ first = false
    Close, but it doesn't tell us how much to prep. That's the Customer forecast. # owner:thinking # bad
    -> c5
* [Allergen questions nobody has time to answer]
    ~ first = false
    No, that's the Menu and allergen helper. # owner:thinking # bad
    -> c5
- ~ first = true
~ total++
And its main risk? # owner:thinking
- (c6)
* [It films the kitchen, so staff must be told and agree, and it's costly]
    ~ right(first)
    ~ dl_risk = "Films the kitchen, so staff must be told in writing, and it's costly to set up"
    Exactly. Nobody likes a camera they didn't know about. # owner:happy # good
* [It needs years of bookings to learn from]
    ~ first = false
    No, it looks at each scrap as it goes in. That's the ML one. # owner:thinking # bad
    -> c6
* [It can give a wrong allergen answer]
    ~ first = false
    No, it doesn't answer customers. That's the Menu and allergen helper. # owner:thinking # bad
    -> c6
- ~ first = true
~ total++
Which one needs years of past records to learn from? # owner:thinking
- (c7)
* [The Customer forecast]
    ~ right(first)
    Yes. Luckily we have three years of bookings. # owner:happy # good
* [The Menu and allergen helper]
    ~ first = false
    No. It needs our menu and allergen chart, not years of records. # owner:thinking # bad
    -> c7
* [The Bin camera]
    ~ first = false
    No. It looks at each scrap as it goes in. # owner:thinking # bad
    -> c7
- ~ first = true
~ total++
Here's your comparison so far. Can we afford all three? # owner:thinking # show:compare
- (c8)
* [No: $4,400 to set up and $355 a month is over budget]
    ~ right(first)
    Right. We have $4,000 and $250 a month, so we have to choose. # owner:worried # good
* [Yes, just]
    ~ first = false
    Add them up: $100 + $800 + $3,500 to set up, and $45 + $90 + $220 a month. # owner:thinking # bad
    -> c8
* [Yes, if we skip the monthly fees]
    ~ first = false
    We can't skip them: the tools stop working. # owner:thinking # bad
    -> c8
- -> first_pick

=== first_pick ===
So, which one would you start with? # owner:thinking # level:Which first? # clock:12:00 pm
~ temp first = true
~ total++
- (p1)
* [The Menu and allergen helper]
    ~ right(first)
    ~ start = "ai"
    Good choice: cheap and quick to start. # owner:happy # good
    -> why_ai
* [The Customer forecast]
    ~ right(first)
    ~ start = "ml"
    Good choice: that's my most expensive problem. # owner:happy # good
    -> why_ml
* [The Bin camera]
    ~ first = false
    It's the most expensive and the hardest to set up. Start smaller, and we can add it later. # owner:worried # bad
    -> p1

= why_ai
~ temp first = true
~ total++
Tell me why, in one line. # owner:thinking
- (w1)
* [It's cheap, quick to start, and frees staff from the same questions all day]
    ~ right(first)
    ~ start_why = "It's cheap and quick to start ($100 and $45 a month), and it frees staff from answering the same menu and allergen questions all day."
    That's a reason I can repeat to the team. # owner:happy # good
* [It never makes mistakes]
    ~ first = false
    It does make mistakes, and with allergens that's dangerous. # owner:worried # bad
    -> w1
* [It cuts our food waste]
    ~ first = false
    That's the Customer forecast's job. # owner:thinking # bad
    -> w1
- ~ first = true
~ total++
How would you manage its main risk? # owner:thinking
- (f1)
* [A chef checks every allergen answer against the allergen chart before it's sent]
    ~ right(first)
    ~ start_fix = "A chef checks every allergen answer against the allergen chart before it's sent (AI rule 1)."
    Yes, and that's our rule 1. # owner:happy # good
* [Let it answer allergy questions on its own at night]
    ~ first = false
    Then nobody checks it. Someone could get hurt. Rule 1. # owner:worried # bad
    -> f1
* [Tell customers to ask the AI, not the staff]
    ~ first = false
    Customers with allergies must always be able to ask a person. # owner:worried # bad
    -> f1
- -> policy

= why_ml
~ temp first = true
~ total++
Tell me why, in one line. # owner:thinking
- (w2)
* [It tackles our most expensive problem: about $800 of food a week]
    ~ right(first)
    ~ start_why = "It tackles our most expensive problem: we throw out about $800 of food a week, and it fits the budget ($800 and $90 a month)."
    That's a reason I can take to the bank. # owner:happy # good
* [It's the cheapest]
    ~ first = false
    The Menu and allergen helper is cheaper. Try again. # owner:thinking # bad
    -> w2
* [It needs no data]
    ~ first = false
    It needs years of bookings. Luckily, we have them. # owner:thinking # bad
    -> w2
- ~ first = true
~ total++
How would you manage its main risk? # owner:thinking
- (f2)
* [The chef checks the forecast each morning and adjusts for weather and events]
    ~ right(first)
    ~ start_fix = "The chef on shift checks the forecast each morning and adjusts for weather and local events, and we compare it with the real numbers every week."
    Yes. It suggests, the chef decides. # owner:happy # good
* [Order exactly what it says, no matter what]
    ~ first = false
    Then one big storm and we're throwing out a cool room. # owner:worried # bad
    -> f2
* [Stop taking bookings, so it has less to learn]
    ~ first = false
    Bookings are what it learns from! # owner:surprised # bad
    -> f2
- -> policy

=== policy ===
Lunch service. Mia, a regular, is at table 6. # scene:dining # clock:1:00 pm # level:Policy problems
I've got a peanut allergy. Your website chat said the green curry is fine. Is it? # customer:worried
~ temp first = true
~ total++
- (r1)
What do you do? # customer:worried
* [Check the allergen chart with the chef before you answer]
    ~ right(first)
    Thanks for checking properly. That means a lot. # customer:happy # good
* [Trust the chat: it answered from our menu]
    ~ first = false
    The chat can sound sure and be wrong. Allergy answers are checked by a chef. Rule 1. # owner:worried # bad
    -> r1
* [Say "should be fine" so she's not worried]
    ~ first = false
    "Should be fine" isn't good enough with a peanut allergy. # customer:surprised # bad
    -> r1
- ~ first = true
~ total++
Later, the menu helper drafts tonight's specials: "Gluten-free chocolate cake." It's made with normal flour. # owner:surprised
- (r2)
* [Fix it before it goes out: a chef checks every allergen claim]
    ~ right(first)
    Good catch. Allergen information must be correct: that's the law. # owner:happy # good
* [Post it: nobody will notice]
    ~ first = false
    Someone with coeliac disease will. Allergen information must be correct. # owner:worried # bad
    -> r2
* [Ban AI from the kitchen]
    ~ first = false
    That's a bit much. Checking each claim fixes it. # owner:thinking # bad
    -> r2
- ~ first = true
~ total++
One more. The bin camera company says we could also put a camera in the staff change room, to stop theft. Good idea? # owner:thinking
- (r3)
* [No: never in a change room. It's against the law, and staff must be told about every camera]
    ~ right(first)
    Glad you stopped me. That's rule 3, and the law. # owner:happy # good
* [Yes, if we don't tell the staff]
    ~ first = false
    Secret cameras break rule 3 and the law. # owner:worried # bad
    -> r3
* [Yes, if the footage is deleted every week]
    ~ first = false
    Deleting it later doesn't make it legal. Never in a change room. # owner:worried # bad
    -> r3
- -> pitch

=== pitch ===
Friday's nearly here. Let's build your one-minute pitch: put the four moves in order. # owner:happy # scene:office # clock:3:00 pm # level:Build your pitch
~ temp first = true
~ total++
- (m1)
What do you say first? # owner:thinking
* [The problem we're solving]
    ~ right(first)
    Yes: start with my problem, so I'm listening. # owner:happy # good
* [My recommendation and why]
    ~ first = false
    Say what problem it solves first, so I know why I should care. # owner:thinking # bad
    -> m1
* [The main risk and how we manage it]
    ~ first = false
    Don't open with the risk: start with my problem. # owner:thinking # bad
    -> m1
* [Ask: "What would you change?"]
    ~ first = false
    That's how you finish, not how you start. # owner:thinking # bad
    -> m1
- ~ first = true
~ total++
- (m2)
And second? # owner:thinking
* [My recommendation and why]
    ~ right(first)
    Yes: problem, then your idea. # owner:happy # good
* [The main risk and how we manage it]
    ~ first = false
    Tell me your idea before its risk. # owner:thinking # bad
    -> m2
* [Ask: "What would you change?"]
    ~ first = false
    Not yet: I haven't heard your idea. # owner:thinking # bad
    -> m2
- ~ first = true
~ total++
- (m3)
Third? # owner:thinking
* [The main risk and how we manage it]
    ~ right(first)
    Yes. Being honest about the risk makes me trust you. # owner:happy # good
* [Ask: "What would you change?"]
    ~ first = false
    Not yet. Tell me the risk first, honestly. # owner:thinking # bad
    -> m3
- Then finish with: "What would you change?" Here's your script. # owner:happy # show:pitch
* [Next]
- -> real_pitch

=== real_pitch ===
Now pitch for real. Your trainer is playing the restaurant owner. Keep your script open if you need it. # level:Pitch the owner # clock:3:30 pm # show:pitch
* [I've pitched to the owner]
- -> owner_feedback

=== owner_feedback ===
Good pitch. What did the owner ask you to change? # owner:thinking # level:Owner's feedback # clock:4:00 pm
* [Start with a short trial first]
    ~ feedback = "Start with a short trial first."
    ~ change = "We trial it for 6 weeks, then compare the results before we keep it."
* [Say how we keep customers' details safe]
    ~ feedback = "Say how we keep customers' details safe."
    ~ change = "Customers' details stay in our approved systems and never go into free AI tools."
* [Explain the monthly cost]
    ~ feedback = "Explain the monthly cost."
    { start == "ml":
        ~ change = "The total cost is $800 to set up and $90 a month, inside the $4,000 and $250 a month budget."
    - else:
        ~ change = "The total cost is $100 to set up and $45 a month, inside the $4,000 and $250 a month budget."
    }
* [Say who checks it, and how often]
    ~ feedback = "Say who checks it, and how often."
    ~ change = "The chef on shift checks it every day and reports any problem to the owner."
- Writing it down isn't enough: change your recommendation. # owner:thinking
* [Update my recommendation]
    Done. It now says: "{change}" # owner:happy # good
- Send me the final version before dinner service. # owner:happy # level:Send it # clock:5:00 pm
-> END
