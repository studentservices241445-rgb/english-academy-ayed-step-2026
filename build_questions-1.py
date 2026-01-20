import json, random
random.seed(2026)

def q(id_, section, question, options, correct, explanation, tag):
    return {
        "id": id_,
        "section": section,
        "question": question,
        "options": options,
        "correctIndex": correct,
        "explanationShort": explanation,
        "skillTag": tag,
    }

questions = []
qid = 1

# ===== Grammar (40) =====
grammar_templates = [
    ("Choose the correct form: If I ___ enough time, I would travel.", ["have", "had", "will have", "has"], 1, "Second conditional uses past simple after 'if' (had).", "conditionals"),
    ("Choose the correct verb: Neither of the students ___ ready.", ["are", "is", "were", "be"], 1, "With 'neither of', we typically use singular verb: is.", "agreement"),
    ("Choose the correct preposition: She is interested ___ science.", ["on", "in", "at", "for"], 1, "'Interested in' is the correct collocation.", "prepositions"),
    ("Choose the correct article: He bought ___ umbrella.", ["a", "an", "the", "—"], 1, "'Umbrella' starts with a vowel sound, so: an.", "articles"),
    ("Choose the best word: This book is ___ than that one.", ["good", "better", "best", "more good"], 1, "Comparative of good is better.", "comparatives"),
    ("Choose the correct pronoun: Each of the boys brought ___ own lunch.", ["their", "his", "her", "our"], 1, "'Each' is singular, so: his (traditional grammar).", "pronouns"),
    ("Choose the correct modal: You ___ smoke here.", ["must", "mustn't", "can", "might"], 1, "'Mustn't' expresses prohibition.", "modals"),
    ("Choose the correct form: I enjoy ___ books.", ["read", "to read", "reading", "reads"], 2, "After 'enjoy' we use gerund: reading.", "gerunds"),
    ("Choose the correct relative pronoun: The man ___ lives next door is a doctor.", ["which", "who", "where", "what"], 1, "For people, use who.", "relative_clauses"),
    ("Choose the correct tense: By next week, I ___ the project.", ["finish", "will finish", "will have finished", "finished"], 2, "Future perfect: will have finished.", "tenses"),
]

variants = [
    ("If we ___ earlier, we wouldn't be late.", ["leave", "left", "will leave", "leaving"], 1, "Second conditional: past simple (left).", "conditionals"),
    ("Neither the teacher nor the students ___ here.", ["is", "are", "was", "be"], 1, "With 'neither...nor', verb agrees with the nearer subject (students): are.", "agreement"),
    ("He apologized ___ being late.", ["for", "to", "at", "with"], 0, "'Apologize for' + gerund/noun.", "prepositions"),
    ("She needs ___ advice.", ["a", "an", "the", "—"], 3, "Uncountable noun 'advice' takes no article in general meaning.", "articles"),
    ("My car is ___ than yours.", ["fast", "faster", "fastest", "more fast"], 1, "Comparative: faster.", "comparatives"),
    ("Everyone must bring ___ ID.", ["their", "his or her", "your", "our"], 1, "Formal/traditional: his or her.", "pronouns"),
    ("You ___ to wear a seatbelt.", ["should", "shouldn't", "may", "could"], 0, "Should = advice/expectation.", "modals"),
    ("They decided ___ a break.", ["taking", "to take", "take", "took"], 1, "Decide + to-infinitive.", "infinitives"),
    ("This is the place ___ we met.", ["which", "where", "who", "when"], 1, "For locations: where.", "relative_clauses"),
    ("I ___ in Riyadh since 2020.", ["live", "lived", "have lived", "am living"], 2, "Since + point in time → present perfect: have lived.", "tenses"),
]

# make 40 by cycling and mixing
pool = grammar_templates + variants
for i in range(40):
    tpl = pool[i % len(pool)]
    question, options, correct, exp, tag = tpl
    # add slight twist for some repetitions
    if i >= len(pool):
        # shuffle distractors but keep correct option at index
        opts = options[:]
        correct_opt = opts[correct]
        distractors = [o for j,o in enumerate(opts) if j != correct]
        random.shuffle(distractors)
        new_opts = distractors[:]
        insert_pos = random.randint(0,3)
        new_opts.insert(insert_pos, correct_opt)
        correct_idx = insert_pos
        options2 = new_opts
    else:
        options2 = options
        correct_idx = correct
    questions.append(q(qid, "grammar", question, options2, correct_idx, exp, tag))
    qid += 1

# ===== Vocabulary (40) =====
vocab = [
    ("abundant", "plentiful"), ("accurate", "correct"), ("achieve", "reach"), ("assist", "help"),
    ("brief", "short"), ("challenge", "difficulty"), ("combine", "mix"), ("complex", "complicated"),
    ("conclude", "finish"), ("confident", "sure"), ("consider", "think about"), ("constant", "continuous"),
    ("decline", "refuse"), ("demonstrate", "show"), ("determine", "decide"), ("efficient", "effective"),
    ("essential", "necessary"), ("evaluate", "judge"), ("expand", "increase"), ("frequent", "often"),
    ("generous", "kind"), ("improve", "make better"), ("indicate", "point out"), ("inevitable", "unavoidable"),
    ("maintain", "keep"), ("major", "important"), ("modify", "change"), ("obvious", "clear"),
    ("permanent", "lasting"), ("predict", "guess"), ("rapid", "fast"), ("reduce", "decrease"),
    ("reliable", "trustworthy"), ("significant", "important"), ("simple", "easy"), ("strengthen", "make stronger"),
    ("temporary", "short-term"), ("unique", "one of a kind"), ("vital", "very important"), ("warn", "caution"),
]

wrong_pool = ["tiny", "angry", "expensive", "silent", "empty", "strange", "weak", "slow", "useless", "late"]

for word, meaning in vocab:
    qtext = f"In this sentence, choose the closest meaning of: '{word}'."
    # options: correct meaning + 3 wrong
    opts = [meaning]
    distractors = random.sample([w for w in vocab if w[1] != meaning], 2)
    opts += [distractors[0][1], distractors[1][1]]
    opts += [random.choice(wrong_pool)]
    random.shuffle(opts)
    correct_idx = opts.index(meaning)
    exp = f"'{word}' is closest to '{meaning}'."
    questions.append(q(qid, "vocab", qtext, opts, correct_idx, exp, "vocab_meaning"))
    qid += 1

# ===== Reading (40) =====
passages = [
    {
      "title":"Study Habits",
      "text":"Many students believe that studying for long hours is the best way to improve. However, research suggests that short, focused sessions with regular breaks often lead to better memory. A simple method is the '25–5' routine: study for 25 minutes, then rest for 5 minutes. Over time, this approach reduces fatigue and helps students stay consistent.",
      "qs":[
        ("What is the main idea of the passage?", ["Longer study sessions are always better.", "Short focused sessions can improve memory.", "Breaks make students forget.", "Research is not useful for students."], 1, "The passage supports short focused sessions with breaks.", "main_idea"),
        ("Why does the '25–5' routine help?", ["It increases fatigue.", "It reduces consistency.", "It reduces fatigue and supports focus.", "It replaces studying completely."], 2, "Breaks reduce fatigue; short sessions support focus.", "detail"),
        ("The word 'consistent' is closest to:", ["regular", "confused", "dangerous", "rare"], 0, "Consistent means regular/steady.", "vocab_in_context"),
        ("Which is implied?", ["Students should never take breaks.", "A plan can be more effective than simply studying longer.", "Only teachers can study effectively.", "Memory cannot improve."], 1, "The passage implies planning matters.", "inference"),
      ]
    },
    {
      "title":"Technology and Focus",
      "text":"Smartphones make it easier to learn, but they also make it easier to lose focus. Notifications, messages, and social media compete for attention. Some students use a simple rule: they put the phone in another room during study time. This small change can reduce interruptions and improve concentration.",
      "qs":[
        ("What problem does the passage discuss?", ["Phones are too expensive.", "Phones can reduce focus while studying.", "Phones cannot be used for learning.", "Social media is always harmful."], 1, "It discusses distraction and attention.", "main_idea"),
        ("What is one suggested solution?", ["Turn up the volume.", "Keep notifications on.", "Put the phone in another room.", "Use more social media."], 2, "The passage suggests removing the phone.", "detail"),
        ("The word 'interruptions' refers to:", ["breaks in attention", "new textbooks", "extra sleep", "music"], 0, "Interruptions = things that stop focus.", "vocab_in_context"),
        ("Which statement is most supported?", ["A small habit can improve concentration.", "Phones never help learning.", "Notifications improve memory.", "Students should study with music."], 0, "The passage supports a small habit change.", "inference"),
      ]
    },
    {
      "title":"Healthy Sleep",
      "text":"Sleep is often the first thing people reduce when they are busy. But sleep is not wasted time. During sleep, the brain organizes information and strengthens memory. Students who sleep well usually learn faster than students who stay awake late every night.",
      "qs":[
        ("What is the main idea?", ["Sleep is a luxury.", "Sleep helps learning and memory.", "Studying at night is best.", "Busy people should avoid sleep."], 1, "Sleep supports memory and learning.", "main_idea"),
        ("According to the passage, what happens during sleep?", ["The brain forgets information.", "The brain organizes information.", "The brain stops working.", "The brain becomes weaker."], 1, "It organizes information and strengthens memory.", "detail"),
        ("The word 'strengthens' is closest to:", ["makes weaker", "makes stronger", "hides", "cancels"], 1, "Strengthen = make stronger.", "vocab_in_context"),
        ("Which is implied?", ["Less sleep always means higher grades.", "Studying more is the only path.", "Good sleep can be a study strategy.", "Sleep is not related to learning."], 2, "Good sleep helps learning.", "inference"),
      ]
    },
    {
      "title":"Public Transportation",
      "text":"In many cities, public transportation reduces traffic and pollution. When more people use buses and trains, fewer cars are on the road. This can make commuting faster for everyone. However, public transportation must be reliable and safe, or people will prefer their own cars.",
      "qs":[
        ("What is one benefit mentioned?", ["More cars on the road", "Higher pollution", "Less traffic", "Longer commuting"], 2, "More public transport means fewer cars and less traffic.", "detail"),
        ("What condition is necessary for people to use public transportation?", ["It must be reliable and safe.", "It must be expensive.", "It must be slower.", "It must be private."], 0, "The passage says reliable and safe.", "detail"),
        ("The word 'commuting' means:", ["traveling to work/school", "shopping online", "cooking", "sleeping"], 0, "Commuting is regular travel.", "vocab_in_context"),
        ("Main idea?", ["Public transportation can help cities, but it must be good quality.", "Cars are always better.", "Buses increase pollution.", "Cities should stop building roads."], 0, "Balanced view: benefits + requirement.", "main_idea"),
      ]
    },
    {
      "title":"Learning Languages",
      "text":"People learn languages for many reasons: education, travel, or work. One of the biggest challenges is fear of making mistakes. Yet mistakes are part of learning. Students who practice speaking early often improve faster because they receive feedback and build confidence.",
      "qs":[
        ("What is the passage mainly about?", ["Why mistakes should be avoided", "How fear of mistakes affects language learning", "Why travel is difficult", "Why only children can learn languages"], 1, "Focus on fear and mistakes.", "main_idea"),
        ("What helps students improve faster?", ["Avoiding speaking", "Speaking early and getting feedback", "Studying only grammar", "Never receiving feedback"], 1, "Speaking early provides feedback and confidence.", "detail"),
        ("The word 'feedback' is closest to:", ["comments", "money", "silence", "punishment"], 0, "Feedback means comments/reactions.", "vocab_in_context"),
        ("Which is implied?", ["Confidence grows with practice.", "Mistakes mean failure.", "Speaking is unnecessary.", "Feedback harms learning."], 0, "Practice and feedback build confidence.", "inference"),
      ]
    },
    {
      "title":"Environmental Choices",
      "text":"Small daily choices can affect the environment. For example, using a reusable bottle reduces plastic waste. Saving electricity by turning off lights also lowers energy use. While one person's actions seem small, millions of people doing the same thing can create a big change.",
      "qs":[
        ("What is the main idea?", ["Only governments can help the environment.", "Small actions can create large environmental change.", "Plastic is harmless.", "Electricity is unlimited."], 1, "Small actions add up.", "main_idea"),
        ("Which example is given?", ["Buying more plastic bottles", "Leaving lights on", "Using a reusable bottle", "Driving longer distances"], 2, "Reusable bottle reduces waste.", "detail"),
        ("The word 'affect' means:", ["influence", "erase", "ignore", "divide"], 0, "Affect = influence.", "vocab_in_context"),
        ("Which is implied?", ["Individual actions never matter.", "Collective behavior can change outcomes.", "Recycling is impossible.", "Energy use does not matter."], 1, "Millions doing the same matters.", "inference"),
      ]
    },
    {
      "title":"Time Management",
      "text":"Time management is not about doing more tasks; it is about doing the right tasks at the right time. A useful approach is to list your tasks and choose the top three priorities. When you focus on priorities, you reduce stress and make steady progress.",
      "qs":[
        ("Main idea?", ["Time management is about doing everything.", "Time management is about priorities.", "Stress is necessary.", "Lists are useless."], 1, "Focus is on priorities.", "main_idea"),
        ("What approach is suggested?", ["Choose the top three priorities", "Do random tasks", "Avoid planning", "Add more tasks"], 0, "Top three priorities.", "detail"),
        ("The word 'steady' is closest to:", ["unstable", "regular", "dangerous", "sudden"], 1, "Steady = regular/consistent.", "vocab_in_context"),
        ("Which is implied?", ["Focusing on priorities can reduce stress.", "Priorities increase stress.", "Planning wastes time.", "Progress is impossible."], 0, "It says reduce stress and progress.", "inference"),
      ]
    },
    {
      "title":"Reading Speed",
      "text":"Some readers try to read as fast as possible, but speed without understanding is not helpful. Effective readers change their speed depending on the text. They may skim simple parts and slow down for difficult ideas. This flexibility improves comprehension.",
      "qs":[
        ("What is the main idea?", ["Reading fast is always best.", "Adjusting reading speed can improve understanding.", "Skimming is harmful.", "Difficult texts should be avoided."], 1, "Flexibility improves comprehension.", "main_idea"),
        ("What do effective readers do?", ["Read at the same speed always", "Never skim", "Change speed based on difficulty", "Avoid difficult ideas"], 2, "They adjust speed.", "detail"),
        ("The word 'skim' means:", ["read quickly for general idea", "write notes", "translate", "stop reading"], 0, "Skim = read quickly for gist.", "vocab_in_context"),
        ("Which is implied?", ["Understanding matters more than speed.", "Speed is the only goal.", "Comprehension is automatic.", "Skimming replaces reading."], 0, "Comprehension is key.", "inference"),
      ]
    },
    {
      "title":"Goal Setting",
      "text":"Setting a clear goal can motivate people. But goals work best when they are specific. For example, 'study more' is vague, but 'study 60 minutes daily for two weeks' is clear. Specific goals make it easier to track progress and stay committed.",
      "qs":[
        ("Main idea?", ["Vague goals are best.", "Specific goals improve commitment.", "Goals are unnecessary.", "Tracking progress is impossible."], 1, "Specific goals help.", "main_idea"),
        ("Which goal is more specific?", ["Study more", "Be better", "Study 60 minutes daily for two weeks", "Try hard"], 2, "That is specific.", "detail"),
        ("The word 'vague' means:", ["unclear", "strong", "beautiful", "fast"], 0, "Vague = unclear.", "vocab_in_context"),
        ("Which is implied?", ["Specific goals are easier to measure.", "Specific goals reduce tracking.", "Goals never motivate.", "Only teachers set goals."], 0, "They help track progress.", "inference"),
      ]
    },
    {
      "title":"Practice Tests",
      "text":"Practice tests help students get used to the format and timing of an exam. When students review their mistakes after each practice test, they learn faster because they understand the reasons behind wrong answers. The key is not to repeat the same errors. Instead, write down patterns of mistakes and fix them one by one.",
      "qs":[
        ("What is the main idea?", ["Practice tests are a waste of time.", "Practice tests can improve performance when mistakes are reviewed.", "Timing does not matter in exams.", "Students should never review mistakes."], 1, "The passage emphasizes practice + reviewing mistakes.", "main_idea"),
        ("What should students do after a practice test?", ["Ignore mistakes", "Review mistakes and understand reasons", "Change the exam format", "Stop studying"], 1, "Reviewing mistakes helps learning.", "detail"),
        ("The word 'format' is closest to:", ["shape and structure", "price", "color", "noise"], 0, "Format means structure/layout.", "vocab_in_context"),
        ("Which is implied?", ["Repeating the same mistakes is helpful.", "Tracking patterns of errors can guide improvement.", "Mistakes cannot be fixed.", "Practice tests replace studying."], 1, "Patterns of mistakes guide improvement.", "inference"),
      ]
    },
]

# Each passage already has 4 questions -> 40 total
for p in passages:
    for qs in p["qs"]:
        question, options, correct, exp, tag = qs
        prompt = f"Read the passage then answer.\n\n{p['text']}\n\nQ: {question}"
        questions.append(q(qid, "reading", prompt, options, correct, exp, tag))
        qid += 1

# ===== Listening (30) =====
listening_scenarios = [
    (
      "You hear a student say: 'I planned to study tonight, but my friends invited me out.'",
      "What is the student's problem?",
      ["He has no friends.", "He is choosing between studying and going out.", "He finished studying.", "He dislikes planning."],
      1,
      "He planned to study, but friends invited him out.",
      "purpose"
    ),
    (
      "A woman says: 'The meeting starts at 9, so let's leave at 8:20 to avoid traffic.'",
      "Why does she suggest leaving early?",
      ["To buy coffee", "To avoid traffic", "To cancel the meeting", "To arrive late"],
      1,
      "She mentions avoiding traffic.",
      "detail"
    ),
    (
      "A man says: 'I tried the new app, but it kept crashing, so I deleted it.'",
      "What did the man do?",
      ["He fixed the app", "He kept using the app", "He deleted the app", "He bought a phone"],
      2,
      "He deleted it because it crashed.",
      "detail"
    ),
    (
      "A teacher says: 'Don't memorize everything. Focus on patterns and practice.'",
      "What is the teacher recommending?",
      ["Memorizing all details", "Focusing on patterns and practice", "Avoiding practice", "Reading without solving"],
      1,
      "He says focus on patterns and practice.",
      "main_idea"
    ),
    (
      "A speaker says: 'I couldn't find the document, so I emailed it to you again.'",
      "What can you infer?",
      ["The document was lost", "The speaker never sent it", "The listener doesn't use email", "The speaker printed it"],
      0,
      "He couldn't find it, so sent again → likely lost.",
      "inference"
    ),
]

# generate more by templating
extra_templates = [
    ("A student says: 'I got a low score in reading because I spent too long on the first passage.'",
     "What should the student improve?",
     ["Time management", "Spelling", "Speaking", "Handwriting"],
     0,
     "Spending too long on one passage indicates time management.",
     "time"),
    ("A man says: 'I will take the bus today because my car is at the mechanic.'",
     "Why will he take the bus?",
     ["He hates buses", "His car is being repaired", "He is late on purpose", "He bought a new car"],
     1,
     "Car is at mechanic.",
     "detail"),
    ("A woman says: 'Could you repeat that, please? The line is not clear.'",
     "What is the problem?",
     ["She is angry", "The connection is bad", "She is late", "The room is too bright"],
     1,
     "Line is not clear.",
     "detail"),
    ("A speaker says: 'I recommend starting with easy questions to build confidence.'",
     "What is the recommendation?",
     ["Start with easy questions", "Skip all questions", "Start with the hardest questions", "Avoid confidence"],
     0,
     "Start easy.",
     "strategy"),
    ("A teacher says: 'Bring your ID tomorrow; you won't be allowed in without it.'",
     "What will happen without an ID?",
     ["You can enter easily", "You will not be allowed in", "You will get a discount", "Nothing"],
     1,
     "Not allowed in.",
     "detail"),
    ("A student says: 'I keep forgetting new words, so I'm making flashcards.'",
     "Why is the student making flashcards?",
     ["To forget words", "To remember vocabulary", "To avoid studying", "To write essays"],
     1,
     "To remember words.",
     "purpose"),
]

# Fill to 30
scenarios = listening_scenarios[:]
while len(scenarios) < 30:
    tpl = random.choice(extra_templates)
    scenarios.append(tpl)

for scen, qtext, options, correct, exp, tag in scenarios[:30]:
    prompt = f"Listen to the situation (no audio provided) then answer.\n\n{scen}\n\nQ: {qtext}"
    questions.append(q(qid, "listening", prompt, options, correct, exp, tag))
    qid += 1

assert len(questions) == 150, len(questions)

# Sanity: all have 4 options
for qq in questions:
    assert len(qq["options"]) == 4
    assert 0 <= qq["correctIndex"] < 4

out = "// Auto-generated question bank (150). You can edit/replace freely.\n" \
      "window.STEP_QUESTIONS = Object.freeze(" + json.dumps(questions, ensure_ascii=False) + ");\n"

with open('/mnt/data/step_site/assets/js/questions.js', 'w', encoding='utf-8') as f:
    f.write(out)

print('Wrote', len(questions), 'questions')
