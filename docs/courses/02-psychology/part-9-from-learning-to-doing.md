---
slug: /courses/performance-foundations/part-9-from-learning-to-doing
sidebar_position: 11
title: "Part IX: From Learning to Doing"
---

import Meme from '@site/src/components/Meme';
import Quiz from '@site/src/components/Quiz';
import {LearnDoConverter} from '@site/src/components/PerformancePractice';

# Part IX: From Learning to Doing

Forty-seven open tabs. Twelve bookmarked courses. Three books in progress about
a language you have never compiled. The library grows, the shipping record does
not — and somehow starting the actual thing still feels like it requires
courage you don't have yet.

<Meme quote="If more information was the answer, then we'd all be billionaires with perfect abs." author="Derek Sivers" />

⏱️ **Reading + practice: ~22 min** · includes 11 minutes for the scope exercise,
tool-building check, widget, and quizzes; building your solution and optional depth are extra.

A love of learning is not the problem. But learning can become an avoidance
strategy wearing a graduation gown: consuming feels like progress while
postponing the risk of trying. Building useful-looking tools can do the same.

## Play: Convert One Obsession

<LearnDoConverter />

The empty artifact field is the diagnostic. If nothing small and real can be
named, the topic is entertainment — which is fine, as long as it stops billing
itself as career development.

## 1. Why Learning Feels Safe and Doing Feels Dangerous

Consuming knowledge is the only form of ambition with no failure mode. A book
cannot reject you. A course cannot compile errors at you. A YouTube tutorial
cannot reveal that your first attempt is clumsy.

Doing, by contrast, produces evidence — and if your self-image is fragile
(see [Part VII](/courses/performance-foundations/part-7-imposter-syndrome)),
evidence is exactly what feels threatening. So the brain proposes an endless
bargain: *one more course, then we'll be ready.* Readiness never arrives,
because readiness was never the goal. Avoidance was.

<details>
<summary>🧠 The illusion of competence (optional)</summary>

Passive input creates *fluency illusions*: re-reading and watching feel like
mastery because recognition is easy, while recall and application remain weak.
Learning research consistently favors *retrieval practice* and *generation* —
using knowledge — over repeated exposure (the testing effect). Skill
acquisition additionally requires feedback from real attempts (deliberate
practice), which no amount of consumption can substitute.

</details>

## 2. Just-in-Case vs. Just-in-Time

- **Just-in-case learning:** stockpiling knowledge for a hypothetical future.
  Retention is poor because nothing anchors it; volume is unbounded because
  "might need someday" matches everything.
- **Just-in-time learning:** pulling exactly what the current build demands,
  when it demands it. Retention is high because every fact gets used within
  hours, and scope is bounded by the artifact.

The obsession doesn't need to be killed — it needs to be put on a leash held
by a project.

<Meme top="just-in-case: 12 courses, 0 artifacts" visual="📚📚📚" bottom="just-in-time: 1 ugly working thing, knowledge that actually stuck" />

## 3. The Courage Part Is Smaller Than It Looks

"I don't have the courage to do them in real-world" overstates what's
required. You do not need courage for a launch, an audience, or a career bet.
You need it for one
[micro-exposure](/courses/performance-foundations/core-techniques#micro-exposure):
build one small real thing, in the
[private sandbox](/courses/performance-foundations/part-2-acting-despite-fear)
where nobody can see it. Courage for an audience can be rented later;
Part II's graded exposure handles that. The first rep is private and cheap.

## 4. The 90/10 Solution: Shrink the Work, Keep the Value

Sometimes you are ready to act, but the version in your head is unnecessarily
large. “Help the team choose a supplier” has quietly become “build an automated
comparison dashboard.” The outcome is a decision. The dashboard is only one
possible means of getting there.

In [YC's essential startup advice](https://www.ycombinator.com/library/4D-yc-s-essential-startup-advice),
Y Combinator attributes the **90/10 solution** to Paul Buchheit: look for a way
to deliver most of the useful outcome with a small fraction of the effort.
YC argues that something useful for a real customer now can be better than a
complete solution delivered much later. This is a paraphrase of YC's summary
of Buchheit's advice, not a verbatim quotation from him.

**The numbers are a heuristic, not a measured law of productivity or psychology.**
You cannot assume that every problem has a ten-times-cheaper solution. Use the
idea as a search question: *Which parts create the value, and which parts did I
add because a “proper” solution felt more impressive?*

<Meme top="The cat built a dashboard to decide which box to sit in." visual="🐱📊" bottom="A two-box trial was available before the first chart rendered." />

### A smaller solution, not just a smaller first step

The examples below are illustrative, not claims about measured 90% returns:

| Actual outcome | Elaborate version | Smaller useful solution |
| --- | --- | --- |
| Choose a supplier today | Automated comparison dashboard | Verified prices and three decision criteria in a shared table |
| Let a teammate reproduce a bug | Comprehensive debugging guide | Minimal reproduction, exact command, and expected versus actual output |
| Coordinate one dinner | Research every venue and build a poll | Check dietary/access needs, propose two suitable options, set a reply deadline |

Opening a blank spreadsheet is a **small first step**. A completed comparison
that lets someone make the decision is a **small useful solution**. The first
helps you begin; the second actually addresses the problem. Do not confuse a
tiny task with a valuable outcome.

YC gives a related example: Airbnb's founders personally photographed early
customers' homes rather than first building a scalable photography operation.
According to YC, better photos improved listings and conversions, while the
visits also created useful customer conversations. Manual work addressed an
immediate bottleneck and taught them what mattered. It illustrates the logic;
it does not establish a numerical 90/10 ratio.

### Define “useful enough” before polishing

For the supplier example: “By 3 p.m., my teammate can choose between three
options using current prices, delivery dates, and the requirements we cannot
compromise on.” Once that is possible, ask for the decision or feedback before
adding charts. If missing information blocks the decision, get that information;
if the missing feature is decoration, defer it.

This can interrupt perfectionistic delay by replacing an open-ended demand to
“do it properly” with an observable finish line. That is a practical application
of the heuristic, not evidence that Buchheit's advice treats perfectionism.
Completion may still feel uncomfortable. Feeling fully reassured is not the
acceptance test.

**Reduce scope, not essential correctness, safety, privacy, accessibility, or
consent.** A quick comparison with invented prices is not useful. Skipping
access controls is not an efficient release. A shorter medical or safety check
is not justified because its omitted steps look like “the last 10%.” Some work
has hard thresholds or genuinely needs sustained practice.

Time-box the search, too: spend five minutes finding simpler alternatives,
then choose a responsible next move. Hunting indefinitely for the perfect
shortcut is the same delay in a smaller hat. After trying the solution, review
what it actually achieved; stop, improve, or replace it based on that evidence.

## 5. Why Am I Building Productivity Tools Instead of Doing My Work?

The dishes are waiting. A work update is overdue. You open your editor to
improve a shortcut, and suddenly two hours have disappeared. You worked hard;
the responsibility barely moved. How can both be true?

**You may be choosing the activity that feels better now, not the outcome that
matters more later.** Building can be genuinely enjoyable *and* serve as a way
to avoid something uncomfortable. Those explanations can coexist. This is a
possible account of the pattern, not a verdict about your motives.

### The editor offers something the sink does not

These are illustrative possibilities; check which ones fit your experience:

| What building may offer | What the waiting responsibility may feel like |
| --- | --- |
| Interest and a fresh puzzle | Repetition: the dishes will return tomorrow |
| Control over the design and finish line | Someone else's demands or priorities |
| Visible feedback: a shortcut finally works | Slow, ambiguous progress or a response you cannot control |
| A familiar place to feel capable | Uncertainty, mistakes, or being evaluated |
| The promise of making future work easier | The discomfort of doing today's work now |

Psychologists call doing something because it is interesting or satisfying
**intrinsic motivation**. Motivation research also emphasizes **autonomy**
(feeling you have a choice) and **competence** (feeling capable). Your own tool
project may supply more of these than a chore or an unclear assignment. That
does not make the chore worthless, or prove that you are afraid of your job.

If opening the editor also makes boredom, worry, or resentment fade, that
relief can encourage the switch next time. A procrastination model calls this
**short-term mood repair**: feeling better now takes priority over the costs
your future self will inherit. Here, the delay looks respectable because the
replacement activity is difficult and potentially useful.

### Useful tool or useful-looking detour?

Ask: **“Which responsibility will this help me complete, and when will I use
it on that responsibility?”** A tool is not automatically avoidance. Fixing a
broken workflow that actually blocks today's deliverable may be necessary.
Building a system for a hypothetical future bottleneck is a different bet.

For example: cleaning five dishes needs no new task manager. Sending a work
update may need three bullets about progress, blockers, and the next step, not
a reporting platform. If the tool works but you still avoid the task, the
missing feature probably was not the whole barrier.

<Meme top="The cat automated the chore reminders." visual="🐱" bottom="The dishes remain impressively unautomated." />

### A three-minute check before opening the editor

1. **Name the switch.** Write the responsibility and what you feel about it:
  bored, unsure, tired, resentful, worried about judgment, or something else.
  “I am lazy” is a judgment, not useful information about this moment.
2. **Try two minutes directly.** Wash five items, draft the first three bullets,
  or identify the one requirement you need clarified. Use what already exists.
  Record whether starting became easier, stayed difficult, or was genuinely
  blocked. The point is to learn, not finish everything in two minutes.
3. **Make the next choice explicit.** Continue with a small work block, ask for
  clarification, or address fatigue. If a tool is necessary, name the exact
  blocker, cap the change, and return to the task to test it. Park other ideas
  in one sentence rather than starting another planning system.

Repeat on a few occasions. Relief right after switching supports an avoidance
account; strong interest even during freely chosen leisure supports genuine
enjoyment. Both may be present, and this informal check cannot prove a cause.
It is fine to schedule tool-building as a hobby without making it justify
itself as productivity. Agreed responsibilities still need their own time.

Being absorbed in enjoyable coding does not establish ADHD or any other
diagnosis. Interest, stress, sleep loss, unclear work, and other factors can
affect starting and switching. If this repeatedly harms work or home life
despite practical changes, an assessment can examine the broader pattern
rather than treating one appealing activity as a diagnostic test.

<details>
<summary>🧠 What the research does and does not explain (optional)</summary>

Sirois and Pychyl's 2013 review describes procrastination in terms of
short-term mood regulation and costs to the future self. Self-determination
theory describes how interest, autonomy, and competence relate to motivation.
Neither source establishes why a particular person builds productivity tools.
The editor-versus-dishes comparison and three-minute check above are practical
illustrations of those ideas, not a validated diagnostic instrument or treatment.

</details>

## 6. Operating Rules

- **No artifact, no enrollment.** Before starting any course, book, or
  tutorial, name the small real thing it will produce within two weeks.
- **Build-to-consume ratio of 2:1.** For every hour of input, two hours of
  hands on the actual thing. Reverse the current default.
- **Learn inside the build.** Start the project first; open the documentation
  when the project gets stuck. Confusion is the syllabus.
- **Value before polish.** Define the useful outcome and its non-negotiables;
  choose a simpler solution before adding optional scope.
- **Tab amnesty.** Close the 47 tabs. Anything genuinely needed will be
  findable again in the moment it is needed — that is the whole point of
  just-in-time.

## Try It Yourself: Find Today's Useful Version

1. Pick the topic you have consumed the most about while building the least.
2. Write the outcome without naming a tool: “Someone can ___.” Add one
  observable acceptance test and the standards you will not cut.
3. Set a five-minute timer. List three simpler ways to achieve that outcome,
  then choose the least costly one that passes the test. Revisit the artifact
  in the converter above with this smaller scope.
4. Try it today, privately first when appropriate. Set a finish time before
  starting; learn only what the attempt needs. If a useful version cannot
  responsibly be completed today, schedule the smallest informative test
  instead and acknowledge that it is not yet a solution.
5. Check the acceptance test, seek relevant feedback, and log the result in your
   [Evidence File](/courses/performance-foundations/core-techniques#evidence-file).
  Record what you deferred and when you will review whether it is needed.

## Three Things to Keep

- Learning and tool-building can be valuable or become useful-looking delay;
  check whether they move the responsibility or mainly change how you feel.
- Put curiosity on a project leash: no artifact, no enrollment; learn
  just-in-time inside the build.
- Look for a smaller useful solution, not just a smaller task; preserve
  non-negotiable standards and let feedback, not endless polish, guide the next step.

## Quick Check

<Quiz
  question="You keep improving your task app while the dishes and a work update wait. What would best help you understand the pattern?"
  options={[
    {text: 'Assume intense coding focus proves ADHD', feedback: 'One absorbing activity cannot establish a diagnosis. You need the wider history and pattern, not a shortcut from one observation.'},
    {text: 'Notice the feeling before switching, try two minutes of the responsibility, and check whether a tool removes an actual blocker', correct: true, feedback: 'Yes. This gives you information about interest, relief, and task friction without assuming that building is always avoidance.'},
    {text: 'Finish the perfect productivity system before attempting any responsibility', feedback: 'That makes a finished system the entry fee for ordinary life. Test the actual barrier before extending the build.'},
  ]}
/>

<Quiz
  question="A fascinating new framework appears. Your finger hovers over 'Enroll in the 40-hour masterclass.' What now?"
  options={[
    {text: 'Enroll — you can\'t build responsibly without complete knowledge', feedback: 'Course #13 joins the graveyard. Completeness was never the bottleneck.'},
    {text: 'Bookmark 30 articles about it for later synthesis', feedback: 'The tabs send their regards. Later never files a report.'},
    {text: 'Name a 7-day artifact first, build it, and learn what the build demands', correct: true, feedback: 'Just-in-time, on a leash, with an artifact at the end. That is the whole method.'},
  ]}
/>

<Quiz
  question="Your teammate needs to choose a supplier this afternoon. What is the strongest 90/10 solution?"
  options={[
    {text: 'Spend the week building a reusable dashboard before sharing anything', feedback: 'Reusability may matter later, but it does not help the decision due today. First check which information actually enables that decision.'},
    {text: 'Send the cheapest-looking option without checking requirements', feedback: 'That cuts essential correctness rather than unnecessary scope. A fast answer that fails the requirements does not solve the problem.'},
    {text: 'Share a verified comparison against the must-have criteria today, then improve it only where feedback shows a need', correct: true, feedback: 'Yes. The useful outcome arrives on time and the essential checks survive. The dashboard can wait until it has an actual job.'},
  ]}
/>

## References for the Tool-Building Question

- [Sirois & Pychyl (2013): Procrastination and the Priority of Short-Term Mood Regulation](https://doi.org/10.1111/spc3.12011)
- [Self-Determination Theory: motivation, autonomy, and competence](https://selfdeterminationtheory.org/theory/)
