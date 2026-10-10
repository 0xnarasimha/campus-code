export interface Student {
  id: string;
  name: string;
  handle: string;
  year: string;
  branch: string;
  avatarInitials: string;
  verified: boolean;
  points: number;
  solved: number;
  cfRating: number;
  lcSolved: number;
  commits: number;
  change: number;
  stacks: string[];
}

export const students: Student[] = [
  {
    id: "s1",
    name: "Aditya Sharma",
    handle: "aditya_sharma_mbu",
    year: "4th",
    branch: "CSE",
    avatarInitials: "AS",
    verified: true,
    points: 9840,
    solved: 612,
    cfRating: 1842,
    lcSolved: 480,
    commits: 1240,
    change: 2,
    stacks: ["Java", "Spring", "PostgreSQL"],
  },
  {
    id: "s2",
    name: "Pooja Krishnan",
    handle: "krishnan_p",
    year: "3rd",
    branch: "AI/ML",
    avatarInitials: "PK",
    verified: true,
    points: 8920,
    solved: 540,
    cfRating: 1720,
    lcSolved: 430,
    commits: 980,
    change: 1,
    stacks: ["Python", "PyTorch", "FastAPI"],
  },
  {
    id: "s3",
    name: "Sai Teja",
    handle: "saiteja_dev",
    year: "3rd",
    branch: "CSE",
    avatarInitials: "ST",
    verified: true,
    points: 8210,
    solved: 505,
    cfRating: 1685,
    lcSolved: 410,
    commits: 870,
    change: -1,
    stacks: ["TypeScript", "React", "Node.js"],
  },
  {
    id: "s4",
    name: "Harshitha Reddy",
    handle: "harshitha_reddy",
    year: "2nd",
    branch: "CSE",
    avatarInitials: "HR",
    verified: false,
    points: 7640,
    solved: 462,
    cfRating: 1590,
    lcSolved: 380,
    commits: 720,
    change: 3,
    stacks: ["Java", "DSA", "MySQL"],
  },
  {
    id: "s5",
    name: "Rohit Varma",
    handle: "rohit_varma_sec",
    year: "4th",
    branch: "Cybersecurity",
    avatarInitials: "RV",
    verified: false,
    points: 7310,
    solved: 430,
    cfRating: 1544,
    lcSolved: 350,
    commits: 690,
    change: -2,
    stacks: ["Go", "Linux", "Wireshark"],
  },
  {
    id: "s6",
    name: "Karthik Nambiar",
    handle: "karthik_nambiar",
    year: "3rd",
    branch: "CSE",
    avatarInitials: "KN",
    verified: false,
    points: 6980,
    solved: 415,
    cfRating: 1510,
    lcSolved: 335,
    commits: 640,
    change: 0,
    stacks: ["C++", "DSA", "Next.js"],
  },
  {
    id: "s7",
    name: "Sneha DS",
    handle: "sneha_ds_mbu",
    year: "2nd",
    branch: "Data Science",
    avatarInitials: "SN",
    verified: false,
    points: 6540,
    solved: 388,
    cfRating: 1462,
    lcSolved: 310,
    commits: 590,
    change: 4,
    stacks: ["Python", "Pandas", "SQL"],
  },
  {
    id: "s8",
    name: "Aravind Swamy",
    handle: "aravind_swamy",
    year: "4th",
    branch: "ECE",
    avatarInitials: "AS",
    verified: false,
    points: 6210,
    solved: 360,
    cfRating: 1420,
    lcSolved: 290,
    commits: 540,
    change: -3,
    stacks: ["C", "Embedded", "Python"],
  },
  {
    id: "s9",
    name: "Manoj Kumar",
    handle: "manoj_kp",
    year: "1st",
    branch: "CSE",
    avatarInitials: "MK",
    verified: false,
    points: 5870,
    solved: 330,
    cfRating: 1388,
    lcSolved: 265,
    commits: 410,
    change: 5,
    stacks: ["JavaScript", "React", "DSA"],
  },
  {
    id: "s10",
    name: "Divya Choudhary",
    handle: "divya_choudhary",
    year: "3rd",
    branch: "IT",
    avatarInitials: "DC",
    verified: false,
    points: 5520,
    solved: 305,
    cfRating: 1345,
    lcSolved: 240,
    commits: 380,
    change: -1,
    stacks: ["Go", "Docker", "React"],
  },
];

export interface PostComment {
  user: string;
  text: string;
}

export interface PostCode {
  file: string;
  lang: string;
  snippet: string;
}

export interface Post {
  id: string;
  author: string;
  time: string;
  location: string;
  topic: string;
  desc: string;
  tags: string[];
  likes: number;
  likedBy: string[];
  comments: PostComment[];
  code?: PostCode;
}

export const posts: Post[] = [
  {
    id: "p1",
    author: "rohan_m.dev",
    time: "2h",
    location: "Central Lib 2F · Table 14",
    topic: "Java OOP deep-dive",
    desc: "Spent the evening refactoring our mini-project with proper abstraction and interfaces. Polymorphism finally clicked when we modeled the library system around it.",
    tags: ["Java", "OOP", "StudyGroup"],
    likes: 214,
    likedBy: ["krishnan_p", "saiteja_dev", "harshitha_reddy"],
    comments: [
      { user: "krishnan_p", text: "That polymorphism example was so clear, joining next session!" },
      { user: "saiteja_dev", text: "Table 14 crew never misses. Save me a seat tomorrow." },
    ],
    code: {
      file: "LibraryItem.java",
      lang: "java",
      snippet:
        "abstract class LibraryItem {\n  abstract int loanDays();\n}\nclass Book extends LibraryItem {\n  int loanDays() { return 14; }\n}",
    },
  },
  {
    id: "p2",
    author: "divya_systems",
    time: "5h",
    location: "CSE Block B · Lab 4",
    topic: "Go Raft consensus lab",
    desc: "Implemented leader election for our distributed systems lab in Go. Three nodes, one leader, zero split-brain. Lab 4 whiteboard session notes attached.",
    tags: ["Go", "DistributedSystems", "Lab4"],
    likes: 186,
    likedBy: ["aditya_sharma_mbu", "divya_choudhary"],
    comments: [
      { user: "aditya_sharma_mbu", text: "Clean election timeout handling. Did you randomize it per node?" },
      { user: "rohit_varma_sec", text: "Would love the whiteboard notes, stuck on log replication." },
    ],
    code: {
      file: "election.go",
      lang: "go",
      snippet:
        "func (n *Node) startElection() {\n  n.term++\n  n.votedFor = n.id\n  n.broadcast(RequestVote{Term: n.term})\n}",
    },
  },
  {
    id: "p3",
    author: "sanjay_algo",
    time: "1d",
    location: "Silent Pod 7",
    topic: "DP patterns masterclass",
    desc: "Ran a 2-hour DP drills session in Pod 7: knapsack, LIS, and digit DP. The trick is always defining the state first, transitions second.",
    tags: ["DSA", "DynamicProgramming", "Pod7"],
    likes: 158,
    likedBy: ["manoj_kp", "sneha_ds_mbu"],
    comments: [
      { user: "manoj_kp", text: "Digit DP finally makes sense after your session. Thank you!" },
    ],
    code: {
      file: "knapsack.py",
      lang: "python",
      snippet:
        "dp = [0] * (W + 1)\nfor wt, val in items:\n  for w in range(W, wt - 1, -1):\n    dp[w] = max(dp[w], dp[w - wt] + val)",
    },
  },
  {
    id: "p4",
    author: "karthik_dev",
    time: "2d",
    location: "Innovation Hub · Studio A",
    topic: "Segment trees from scratch",
    desc: "Built a lazy segment tree with range updates for the contest prep series. Visualized every propagation step on the Studio A board.",
    tags: ["C++", "SegmentTree", "CP"],
    likes: 142,
    likedBy: ["karthik_nambiar", "saiteja_dev"],
    comments: [
      { user: "karthik_nambiar", text: "That lazy propagation diagram should be framed." },
      { user: "harshitha_reddy", text: "Sharing this with my juniors, gold." },
    ],
    code: {
      file: "segtree.cpp",
      lang: "cpp",
      snippet:
        "void push(int v) {\n  tree[v*2] += lazy[v];\n  tree[v*2+1] += lazy[v];\n  lazy[v*2] += lazy[v];\n  lazy[v*2+1] += lazy[v];\n  lazy[v] = 0;\n}",
    },
  },
];

export interface Spot {
  id: string;
  name: string;
  building: string;
  occupancy: number;
  capacity: number;
  quietness: number;
  amenities: string[];
  openSeats: number;
  active: boolean;
  gradient: string;
}

export const spots: Spot[] = [
  {
    id: "spot1",
    name: "Table 14",
    building: "Central Library · 2F",
    occupancy: 3,
    capacity: 4,
    quietness: 4,
    amenities: ["Power outlets", "Whiteboard", "Wi-Fi"],
    openSeats: 1,
    active: true,
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "spot2",
    name: "Lab 4",
    building: "CSE Block B",
    occupancy: 4,
    capacity: 6,
    quietness: 3,
    amenities: ["Desktops", "Projector", "Wi-Fi"],
    openSeats: 2,
    active: true,
    gradient: "from-sky-400 to-blue-600",
  },
  {
    id: "spot3",
    name: "Silent Pod 7",
    building: "Central Library · 3F",
    occupancy: 1,
    capacity: 2,
    quietness: 5,
    amenities: ["Soundproof", "Focus light", "Wi-Fi"],
    openSeats: 1,
    active: true,
    gradient: "from-violet-400 to-purple-600",
  },
  {
    id: "spot4",
    name: "Studio A",
    building: "Innovation Hub",
    occupancy: 5,
    capacity: 8,
    quietness: 2,
    amenities: ["Whiteboards", "Bean bags", "Coffee"],
    openSeats: 3,
    active: true,
    gradient: "from-emerald-400 to-teal-600",
  },
  {
    id: "spot5",
    name: "Terrace Cafe",
    building: "Food Court · Rooftop",
    occupancy: 6,
    capacity: 10,
    quietness: 1,
    amenities: ["Coffee", "Snacks", "Open air"],
    openSeats: 4,
    active: false,
    gradient: "from-rose-400 to-pink-600",
  },
  {
    id: "spot6",
    name: "Civil Lab",
    building: "Civil Block · Ground Floor",
    occupancy: 2,
    capacity: 6,
    quietness: 3,
    amenities: ["Drafting tables", "Wi-Fi", "Lockers"],
    openSeats: 4,
    active: false,
    gradient: "from-slate-400 to-gray-600",
  },
];

export interface RankingRow {
  rank: number;
  handle: string;
  name: string;
  meta: string;
  points: number;
  detail: string;
  delta: number;
}

export const rankingsWeekly: RankingRow[] = [
  { rank: 1, handle: "aditya_sharma_mbu", name: "Aditya Sharma", meta: "4th · CSE", points: 9840, detail: "612 solved · 1240 commits", delta: 2 },
  { rank: 2, handle: "krishnan_p", name: "Pooja Krishnan", meta: "3rd · AI/ML", points: 8920, detail: "540 solved · 980 commits", delta: 1 },
  { rank: 3, handle: "saiteja_dev", name: "Sai Teja", meta: "3rd · CSE", points: 8210, detail: "505 solved · 870 commits", delta: -1 },
  { rank: 4, handle: "harshitha_reddy", name: "Harshitha Reddy", meta: "2nd · CSE", points: 7640, detail: "462 solved · 720 commits", delta: 3 },
  { rank: 5, handle: "rohit_varma_sec", name: "Rohit Varma", meta: "4th · Cybersecurity", points: 7310, detail: "430 solved · 690 commits", delta: -2 },
  { rank: 6, handle: "karthik_nambiar", name: "Karthik Nambiar", meta: "3rd · CSE", points: 6980, detail: "415 solved · 640 commits", delta: 0 },
  { rank: 7, handle: "sneha_ds_mbu", name: "Sneha DS", meta: "2nd · Data Science", points: 6540, detail: "388 solved · 590 commits", delta: 4 },
  { rank: 8, handle: "aravind_swamy", name: "Aravind Swamy", meta: "4th · ECE", points: 6210, detail: "360 solved · 540 commits", delta: -3 },
  { rank: 9, handle: "manoj_kp", name: "Manoj Kumar", meta: "1st · CSE", points: 5870, detail: "330 solved · 410 commits", delta: 5 },
  { rank: 10, handle: "divya_choudhary", name: "Divya Choudhary", meta: "3rd · IT", points: 5520, detail: "305 solved · 380 commits", delta: -1 },
];

export const rankingsMonthly: RankingRow[] = [
  { rank: 1, handle: "krishnan_p", name: "Pooja Krishnan", meta: "3rd · AI/ML", points: 34200, detail: "2100 solved · 3900 commits", delta: 1 },
  { rank: 2, handle: "aditya_sharma_mbu", name: "Aditya Sharma", meta: "4th · CSE", points: 33850, detail: "2400 solved · 4800 commits", delta: -1 },
  { rank: 3, handle: "harshitha_reddy", name: "Harshitha Reddy", meta: "2nd · CSE", points: 30120, detail: "1800 solved · 2900 commits", delta: 2 },
  { rank: 4, handle: "saiteja_dev", name: "Sai Teja", meta: "3rd · CSE", points: 29740, detail: "1950 solved · 3400 commits", delta: -1 },
  { rank: 5, handle: "sneha_ds_mbu", name: "Sneha DS", meta: "2nd · Data Science", points: 27410, detail: "1500 solved · 2300 commits", delta: 3 },
  { rank: 6, handle: "rohit_varma_sec", name: "Rohit Varma", meta: "4th · Cybersecurity", points: 26980, detail: "1650 solved · 2700 commits", delta: -1 },
  { rank: 7, handle: "manoj_kp", name: "Manoj Kumar", meta: "1st · CSE", points: 24150, detail: "1200 solved · 1600 commits", delta: 4 },
  { rank: 8, handle: "karthik_nambiar", name: "Karthik Nambiar", meta: "3rd · CSE", points: 23870, detail: "1600 solved · 2500 commits", delta: -2 },
  { rank: 9, handle: "divya_choudhary", name: "Divya Choudhary", meta: "3rd · IT", points: 22630, detail: "1180 solved · 1500 commits", delta: 1 },
  { rank: 10, handle: "aravind_swamy", name: "Aravind Swamy", meta: "4th · ECE", points: 21940, detail: "1400 solved · 2100 commits", delta: -2 },
];

export const rankingsAllTime: RankingRow[] = [
  { rank: 1, handle: "aditya_sharma_mbu", name: "Aditya Sharma", meta: "4th · CSE", points: 128400, detail: "8200 solved · 15600 commits", delta: 0 },
  { rank: 2, handle: "saiteja_dev", name: "Sai Teja", meta: "3rd · CSE", points: 115700, detail: "7400 solved · 12900 commits", delta: 1 },
  { rank: 3, handle: "krishnan_p", name: "Pooja Krishnan", meta: "3rd · AI/ML", points: 113200, detail: "7100 solved · 12400 commits", delta: -1 },
  { rank: 4, handle: "rohit_varma_sec", name: "Rohit Varma", meta: "4th · Cybersecurity", points: 98750, detail: "6300 solved · 10800 commits", delta: 2 },
  { rank: 5, handle: "harshitha_reddy", name: "Harshitha Reddy", meta: "2nd · CSE", points: 95400, detail: "5900 solved · 9600 commits", delta: -1 },
  { rank: 6, handle: "aravind_swamy", name: "Aravind Swamy", meta: "4th · ECE", points: 88100, detail: "5600 solved · 8900 commits", delta: 3 },
  { rank: 7, handle: "karthik_nambiar", name: "Karthik Nambiar", meta: "3rd · CSE", points: 84900, detail: "5400 solved · 8300 commits", delta: -1 },
  { rank: 8, handle: "divya_choudhary", name: "Divya Choudhary", meta: "3rd · IT", points: 79800, detail: "4900 solved · 7200 commits", delta: 2 },
  { rank: 9, handle: "sneha_ds_mbu", name: "Sneha DS", meta: "2nd · Data Science", points: 76200, detail: "4600 solved · 6800 commits", delta: -2 },
  { rank: 10, handle: "manoj_kp", name: "Manoj Kumar", meta: "1st · CSE", points: 68500, detail: "3900 solved · 5400 commits", delta: 0 },
];

export interface Conversation {
  id: string;
  name: string;
  handle: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  initials: string;
  active?: boolean;
}

export const conversations: Conversation[] = [
  {
    id: "aditya",
    name: "Aditya Sharma",
    handle: "aditya_sharma_mbu",
    preview: "Sending the pod pass for tonight's session",
    time: "2m",
    unread: 2,
    online: true,
    initials: "AS",
    active: true,
  },
  {
    id: "pooja",
    name: "Pooja Krishnan",
    handle: "krishnan_p",
    preview: "That Raft visualization was amazing",
    time: "1h",
    unread: 0,
    online: true,
    initials: "PK",
  },
  {
    id: "guild",
    name: "MBU Algorithmic Guild",
    handle: "mbu_algo_guild",
    preview: "Sai: weekend contest at 6pm, be there",
    time: "3h",
    unread: 5,
    online: false,
    initials: "MG",
  },
  {
    id: "divya",
    name: "Divya Choudhary",
    handle: "divya_choudhary",
    preview: "Can you review my Go lab before Friday?",
    time: "1d",
    unread: 0,
    online: false,
    initials: "DC",
  },
];

export interface Message {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}

export const messagesById: Record<string, Message[]> = {
  aditya: [
    { id: "m1", from: "them", text: "Hey! Are you coming to the night lab session?", time: "10:24 PM" },
    { id: "m2", from: "me", text: "Yes, saving us seats at Table 14?", time: "10:26 PM" },
    { id: "m3", from: "them", text: "Done. Here's your pod pass for tonight — show it at the library desk.", time: "10:28 PM" },
    { id: "m4", from: "them", text: "Doors close at 11, don't be late!", time: "10:28 PM" },
  ],
  pooja: [
    { id: "m1", from: "them", text: "That Raft visualization was amazing, thanks for sharing!", time: "9:15 PM" },
    { id: "m2", from: "me", text: "Anytime! Lab 4 session notes are on the hub too.", time: "9:20 PM" },
  ],
  guild: [
    { id: "m1", from: "them", text: "Sai: weekend contest at 6pm, be there", time: "7:02 PM" },
    { id: "m2", from: "me", text: "Registered! Bringing the Pod 7 crew along.", time: "7:10 PM" },
  ],
  divya: [
    { id: "m1", from: "them", text: "Can you review my Go lab before Friday?", time: "Yesterday" },
    { id: "m2", from: "me", text: "Sure, push it tonight and I'll look in the morning.", time: "Yesterday" },
  ],
};

export interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
}

export interface ProfileGridItem {
  id: string;
  title: string;
  meta: string;
}

export interface Profile {
  handle: string;
  name: string;
  bio: string;
  stats: ProfileStats;
  highlights: string[];
  grid: ProfileGridItem[];
}

export const profile: Profile = {
  handle: "karthik_dev",
  name: "Karthik Ramaswamy",
  bio: "CSE '26 @ MBU · Competitive programming & systems · Night-lab regular at Table 14. Building in public.",
  stats: { posts: 486, followers: 1420, following: 850 },
  highlights: ["LeetCode", "Hackathons", "Projects", "Night Labs", "Certificates"],
  grid: [
    { id: "g1", title: "Segment Tree Visualizer", meta: "C++ · 2.1k stars" },
    { id: "g2", title: "Raft in Go", meta: "Go · Lab series" },
    { id: "g3", title: "DP Cheatsheet", meta: "Python · 4.8k saves" },
    { id: "g4", title: "Campus Heatmap", meta: "Next.js · Hackathon" },
    { id: "g5", title: "OOP in Java", meta: "Java · Tutorial" },
    { id: "g6", title: "Night Lab Logs", meta: "Photo dump · 128" },
  ],
};
