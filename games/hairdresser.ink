// A day at the salon: the Session 3 workplace game for a hairdresser (taegordon.au/hairdresser).
// Written in ink (inklestudios.com/ink). Tags drive the page:
//   # owner:happy / # client:worried   who speaks, and their face (happy, worried, thinking, surprised)
//   # scene:desk / colour / office      the background
//   # level:Name   # clock:9:00 am      the level title and the time of day
//   # good / # bad                      a right or wrong answer
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

-> morning

=== function right(f) ===
{ f:
    ~ score++
}

=== morning ===
Harbour Hair Studio, Geelong. It's 9 am, and you look after the salon's computers and apps. # scene:desk # clock:9:00 am # level:Morning at the salon
Morning! Thanks for coming in. # owner:happy
I've got three problems, and I need your help. # owner:worried
One: about six clients a week don't turn up. That's around $600 a week we lose. # owner:worried
Two: Instagram and booking messages pile up while my hands are in foils, so people book somewhere else. # owner:worried
Three: some colour clients don't like the result, and we redo it for free. # owner:worried
Everyone talks about AI. Find me one idea I can start next month. # owner:thinking
My budget is $3,000 to set up and $150 a month. # owner:thinking
On Friday I'll have one minute between clients to hear it. # owner:happy
First, read our AI rules. They're in your notes too. # owner:thinking # show:policy
* [Got it]
- -> spot

=== spot ===
Let's warm up. What kind of tool is each one? # owner:happy # level:Spot it # clock:9:30 am
~ temp first = true
~ total++
- (q1)
"Our booking system texts every client 24 hours before their appointment." # owner:thinking
* [A fixed rule]
    ~ right(first)
    Yes! A person wrote the steps: same time, same text, every time. That's not AI. # owner:happy # good
* [AI that works with text]
    ~ first = false
    Not quite. Nothing is learned here: a person set the rule. Try again. # owner:thinking # bad
    -> q1
* [ML: predicts from past data]
    ~ first = false
    Not quite. It doesn't predict anything: it sends the same text every time. Try again. # owner:thinking # bad
    -> q1
* [DL: pictures or sound]
    ~ first = false
    Not quite. There are no pictures or sound, just a fixed text. Try again. # owner:thinking # bad
    -> q1
- ~ first = true
~ total++
- (q2)
"A tool that writes friendly replies to Instagram messages." # owner:thinking
* [A fixed rule]
    ~ first = false
    Not quite. It writes new replies each time, so nobody wrote the steps. Try again. # owner:thinking # bad
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
"A tool that learns from three years of bookings who is likely not to turn up." # owner:thinking
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
    Not quite. It uses booking records, not pictures or sound. Try again. # owner:thinking # bad
    -> q3
- ~ first = true
~ total++
- (q4)
"An app that shows a client her selfie with a new hair colour." # owner:thinking
* [A fixed rule]
    ~ first = false
    Not quite. Nobody could write rules for every face and every colour. Try again. # owner:thinking # bad
    -> q4
* [AI that works with text]
    ~ first = false
    Not quite. It works with a photo, not text. Try again. # owner:thinking # bad
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
Which of my three problems does the Message helper solve? # owner:thinking # level:Compare # clock:11:00 am
~ temp first = true
~ total++
- (c1)
* [Messages that pile up while I'm busy]
    ~ right(first)
    ~ ai_goal = "Answers Instagram and booking messages while staff are busy"
    Right. It drafts the replies, and we check and send them. # owner:happy # good
* [Clients who don't turn up]
    ~ first = false
    No, that's the job of the No-show predictor. # owner:thinking # bad
    -> c1
* [Colour redos]
    ~ first = false
    No, that's what the Colour try-on is for. # owner:thinking # bad
    -> c1
- ~ first = true
~ total++
And its main risk? # owner:thinking
- (c2)
* [It can write a confident wrong answer, like a wrong price]
    ~ right(first)
    ~ ai_risk = "Can write a confident wrong answer, such as a wrong price"
    Exactly. That's why a person checks every message. # owner:happy # good
* [It needs years of booking records]
    ~ first = false
    No. It needs our prices and services, not years of records. That's the ML one. # owner:thinking # bad
    -> c2
* [It uses clients' face photos]
    ~ first = false
    No, it never sees photos. That's the Colour try-on. # owner:thinking # bad
    -> c2
- ~ first = true
~ total++
Next, the No-show predictor. Which problem does it solve? # owner:thinking
- (c3)
* [Clients who don't turn up]
    ~ right(first)
    ~ ml_goal = "Fewer clients who don't turn up"
    Right. It picks who might not come, so we send them an extra reminder. # owner:happy # good
* [Messages that pile up while I'm busy]
    ~ first = false
    No, that's the Message helper. # owner:thinking # bad
    -> c3
* [Colour redos]
    ~ first = false
    No, that's the Colour try-on. # owner:thinking # bad
    -> c3
- ~ first = true
~ total++
And its main risk? # owner:thinking
- (c4)
* [It could treat some groups of clients unfairly]
    ~ right(first)
    ~ ml_risk = "Could treat some groups of clients unfairly (bias)"
    Yes. If it learns from unfair patterns, it repeats them. We'd check it treats everyone fairly. # owner:happy # good
* [It can make up a fake discount in a message]
    ~ first = false
    No, it doesn't write messages. That's the Message helper. # owner:thinking # bad
    -> c4
* [It struggles with poor lighting in photos]
    ~ first = false
    No, it doesn't use photos. That's the Colour try-on. # owner:thinking # bad
    -> c4
- ~ first = true
~ total++
Last, the Colour try-on. Which problem does it solve? # owner:thinking
- (c5)
* [Colour redos]
    ~ right(first)
    ~ dl_goal = "Fewer colour redos: clients see the colour before it's dyed"
    Right. Clients see the colour before we dye it. # owner:happy # good
* [Clients who don't turn up]
    ~ first = false
    No, that's the No-show predictor. # owner:thinking # bad
    -> c5
* [Messages that pile up while I'm busy]
    ~ first = false
    No, that's the Message helper. # owner:thinking # bad
    -> c5
- ~ first = true
~ total++
And its main risk? # owner:thinking
- (c6)
* [It uses clients' face photos, so it needs consent and safe storage]
    ~ right(first)
    ~ dl_risk = "Uses clients' face photos: needs consent and safe storage"
    Exactly. Face photos are personal information. # owner:happy # good
* [It needs years of booking records]
    ~ first = false
    No, it needs a selfie, not booking records. # owner:thinking # bad
    -> c6
* [It can promise the wrong price]
    ~ first = false
    No, it doesn't write messages. That's the Message helper. # owner:thinking # bad
    -> c6
- ~ first = true
~ total++
Which one needs years of past records to learn from? # owner:thinking
- (c7)
* [The No-show predictor]
    ~ right(first)
    Yes. Luckily we have three years of bookings. # owner:happy # good
* [The Message helper]
    ~ first = false
    No. It needs our prices and services, not years of records. # owner:thinking # bad
    -> c7
* [The Colour try-on]
    ~ first = false
    No. It works on each selfie as it comes. # owner:thinking # bad
    -> c7
- ~ first = true
~ total++
Here's your comparison so far. Can we afford all three? # owner:thinking # show:compare
- (c8)
* [No: $3,100 to set up and $205 a month is over budget]
    ~ right(first)
    Right. We have $3,000 and $150 a month, so we have to choose. # owner:worried # good
* [Yes, just]
    ~ first = false
    Add them up: $100 + $500 + $2,500 to set up, and $45 + $40 + $120 a month. # owner:thinking # bad
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
* [The Message helper]
    ~ right(first)
    ~ start = "ai"
    Good choice: cheap and quick to start. # owner:happy # good
    -> why_ai
* [The No-show predictor]
    ~ right(first)
    ~ start = "ml"
    Good choice: that's my most expensive problem. # owner:happy # good
    -> why_ml
* [The Colour try-on]
    ~ first = false
    It's the most expensive and the hardest to set up. Start smaller, and we can add it later. # owner:worried # bad
    -> p1

= why_ai
~ temp first = true
~ total++
Tell me why, in one line. # owner:thinking
- (w1)
* [It's cheap, quick to start, and stops us losing bookings]
    ~ right(first)
    ~ start_why = "It's cheap and quick to start ($100 and $45 a month), and it stops us losing bookings from unanswered messages."
    That's a reason I can repeat to my staff. # owner:happy # good
* [It never makes mistakes]
    ~ first = false
    It does make mistakes. That's its main risk. # owner:worried # bad
    -> w1
* [It fixes the no-shows]
    ~ first = false
    That's the No-show predictor's job. # owner:thinking # bad
    -> w1
- ~ first = true
~ total++
How would you manage its main risk? # owner:thinking
- (f1)
* [A staff member checks every reply before it's sent]
    ~ right(first)
    ~ start_fix = "A staff member checks every reply before it's sent (AI rule 3)."
    Yes, and that's our rule 3. # owner:happy # good
* [Let it send replies on its own at night]
    ~ first = false
    Then nobody checks it. That breaks rule 3. # owner:worried # bad
    -> f1
* [Only use it for complaints]
    ~ first = false
    Complaints are the last thing to hand to a tool. # owner:worried # bad
    -> f1
- -> policy

= why_ml
~ temp first = true
~ total++
Tell me why, in one line. # owner:thinking
- (w2)
* [It fixes our most expensive problem: about $600 a week]
    ~ right(first)
    ~ start_why = "It tackles our most expensive problem: no-shows cost about $600 a week, and it fits the budget ($500 and $40 a month)."
    That's a reason I can take to the bank. # owner:happy # good
* [It's the cheapest]
    ~ first = false
    The Message helper is cheaper. Try again. # owner:thinking # bad
    -> w2
* [It needs no data]
    ~ first = false
    It needs years of bookings. Luckily, we have them. # owner:thinking # bad
    -> w2
- ~ first = true
~ total++
How would you manage its main risk? # owner:thinking
- (f2)
* [Check it treats all clients fairly, and a person decides who gets a call]
    ~ right(first)
    ~ start_fix = "We check it treats all clients fairly, and a staff member decides who gets an extra reminder."
    Yes. It suggests, we decide. # owner:happy # good
* [Let it decide on its own who pays a deposit]
    ~ first = false
    Then nobody checks if it's fair. # owner:worried # bad
    -> f2
* [Don't tell clients we use it]
    ~ first = false
    Clients should know how we use their booking history. # owner:worried # bad
    -> f2
- -> policy

=== policy ===
After lunch, Jess comes in for her colour appointment. The try-on company has given the salon a free demo. # scene:colour # clock:1:00 pm # level:Policy problems
Hi! I just sent you a selfie. Can I see myself with copper hair? # client:happy
~ temp first = true
~ total++
- (r1)
What do you do first? # client:happy
* [Ask Jess if she agrees, and tell her how the photo is used and when it's deleted]
    ~ right(first)
    Sure, go ahead! Thanks for asking. # client:happy # good
* [Save her selfie in the salon's shared folder for later]
    ~ first = false
    Wait, who can see that folder? Rule 1: photos only with consent, and deleted when no longer needed. # owner:worried # bad
    -> r1
* [Post her before-and-after on Instagram]
    ~ first = false
    Not without asking me! # client:surprised # bad
    -> r1
- ~ first = true
~ total++
Later, the Message helper drafts a reply: "Yes! 20% off all colours this week." There's no such offer. # owner:surprised
- (r2)
* [Fix it before it's sent: a person checks every message]
    ~ right(first)
    Good catch. That's exactly why we have rule 3. # owner:happy # good
* [Send it: the AI wrote it, so it must be right]
    ~ first = false
    It sounded sure and it was wrong. Now we owe everyone a discount! # owner:worried # bad
    -> r2
* [Turn the AI off forever]
    ~ first = false
    That's a bit much. Checking each message fixes it. # owner:thinking # bad
    -> r2
- ~ first = true
~ total++
One more. Can I paste our client list, with phone numbers and dye allergy notes, into free ChatGPT to find who to rebook? # owner:thinking
- (r3)
* [No. Allergy notes are health information: use only the data needed, in an approved business tool]
    ~ right(first)
    Glad you stopped me. The Privacy Act protects health information. # owner:happy # good
* [Yes, if you delete the chat afterwards]
    ~ first = false
    Deleting it later doesn't undo sharing it. That breaks rule 2. # owner:worried # bad
    -> r3
* [Yes, phone numbers aren't private]
    ~ first = false
    They are personal information, and allergy notes are health information. # owner:worried # bad
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
Now pitch for real. Your trainer is playing the salon owner. Keep your script open if you need it. # level:Pitch the owner # clock:3:30 pm # show:pitch
* [I've pitched to the owner]
- -> owner_feedback

=== owner_feedback ===
That was useful. What did the owner ask you to change? # owner:thinking # level:Owner's feedback # clock:4:00 pm
* [Start with a short trial first]
    ~ feedback = "Start with a short trial first."
    ~ change = "We start with a 3-month trial, then check the results before we keep it."
* [Say how we get clients' consent]
    ~ feedback = "Say how we get clients' consent."
    ~ change = "We tell clients how their information is used and ask for their consent before we start."
* [Explain the monthly cost]
    ~ feedback = "Explain the monthly cost."
    { start == "ml":
        ~ change = "The total cost is $500 to set up and $40 a month, inside the $3,000 and $150 a month budget."
    - else:
        ~ change = "The total cost is $100 to set up and $45 a month, inside the $3,000 and $150 a month budget."
    }
* [Say who checks it, and how often]
    ~ feedback = "Say who checks it, and how often."
    ~ change = "The front-desk manager checks it every day and reports any problem to the owner."
- Writing it down isn't enough: change your recommendation. # owner:thinking
* [Update my recommendation]
    Done. It now says: "{change}" # owner:happy # good
- Send me the final version before you go. # owner:happy # level:Send it # clock:5:00 pm
-> END
