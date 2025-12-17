# Database Models (concept)

```prisma
model Media {
  id          String   @id @default(uuid())
  title       String
  year        Int
  type        String   // movie, book, music
  genres      String[]
  language    String
  rating      Float?
  isAdult     Boolean
  tags        Tag[]
  createdAt   DateTime @default(now())
}

model Tag {
  id        String   @id @default(uuid())
  name      String
  color     String
  media     Media[]
}
```

Local storage options: SQLite (desktop) or IndexedDB (browser). Remote: Supabase.
