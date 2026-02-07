# Nim Stick Game

This is a two player turn based game using TCP server. Whoever takes the last
stick losses the game

## Rules

- There will be 20 sticks in the middle
- Each player will get a chance to remove sticks
- A player can remove **maximum 3** sticks and **minimum 1** stick
- Whoever takes the last stick losses the game

## Instructions

- After two players join

```
Enter your name
>
```

- After both players enter their name

```
Ready to play!!
Player 1's move then Player 2's move then again 1
```

- After each turn

```
          N O  O F  S T I C K S  L E F T
**************************************************
               🦯🦯🦯🦯🦯
**************************************************
```

- At last

```
Announcement of winners if the game ends gracefully
```

## Sample input & output

### 1.

### input

```
Sticks left: 9
input -> 3
```

### Output

```
Sticks left: 6
```

### 2.

### input

```
Sticks left: 9
input -> hello
```

### Output

```
Hello is not a valid move
Enter your move
>
```

### 3.

### input

```
Sticks left: 2
input -> 3
```

### Output

```
3 is not a valid move
Enter your move
>
```

### 4.

### input

```
Sticks left: 2
input -> 1
```

### Output

```
Broadcast winning message
```

## Start the game

```
deno task dev

// Join from other terminals using
telnet hostname 8000
```
