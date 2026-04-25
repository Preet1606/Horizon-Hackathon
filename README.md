

# Cipher Hue — Mastermind Puzzle Engine
Algorithmically correct Mastermind-style puzzle game with a two-pass feedback system (exact + partial matches), smooth CSS animations, multiple difficulty levels, and a local leaderboard for tracking performance.

---

## 🎯 Objective
**Crack the hidden colour code before you run out of guesses.**

---

## 🕹️ How to Play

### 1️⃣ Choose a Difficulty
Select your preferred challenge level:
- 🟢 **Easy:** 4 colours | 4 slots | 8 guesses
- 🟡 **Medium:** 6 colours | 5 slots | 10 guesses
- 🔴 **Hard:** 8 colours | 6 slots | 12 guesses

### 2️⃣ Enter Your Name
Type your name to ensure your score appears on the **Leaderboard** after the round.

### 3️⃣ Fill in a Guess Row
- Click a slot to cycle through available colours, or **drag a colour** into place.
- Ensure all slots in the current row are filled before submitting.

### 4️⃣ Submit Your Guess
- Hit the **Confirm/Submit** button to lock in your row.
- ⏱️ *The countdown timer is ticking — don't take too long!*

### 5️⃣ Read the Peg Feedback
The pegs reveal one by one with a stagger animation to give you clues:
- ⚫ **Black peg:** Correct colour & correct position.
- ⚪ **White peg:** Correct colour, but wrong position.
- ❌ *(no peg):* Colour is not in the code at all.

### 6️⃣ Deduce & Repeat
Use the feedback from each row to logically narrow down the possible combinations. Repeat steps 3–5 until you crack the code or run out of guesses.

---

## 🏆 Game Outcomes

### 🌟 Winning
- Get all **black pegs** in a row and you crack the code!
- A confetti burst fires, displaying your stats (guesses used + time).
- Your score is saved to the leaderboard for your specific difficulty tier.

### 💀 Losing
- If you use all your guesses without cracking the code, the game ends and the hidden code is revealed to you.

---

## 💡 Pro Tips

> [!TIP]
> - **Start Broad:** Begin with a diverse guess covering many different colours to gather initial clues.
> - **Black Pegs:** Keep that colour **and** that position.
> - **White Pegs:** Keep that colour but **move it** to a different slot.
> - **No Peg:** Eliminate that colour entirely from your next guesses.
> - **Hint System:** Use the **Hint** option to reveal one correct position, but beware: *it costs score points!*

---
## Getting Started

First, run the development server:

```bash
npm run dev
```

Open with your browser to see the game.
https://horizon-hackathon-mauve.vercel.app
