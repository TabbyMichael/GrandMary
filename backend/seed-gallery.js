import { getDatabase } from './src/database/init.js';

async function seedGallery() {
  try {
    console.log('🌱 Seeding gallery with sample data...');
    
    const db = await getDatabase();
    
    // Initialize gallery tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS gallery_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uploader_name TEXT NOT NULL,
        uploader_email TEXT,
        uploader_ip TEXT,
        title TEXT,
        caption TEXT,
        file_name TEXT NOT NULL,
        original_file_name TEXT NOT NULL,
        file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        tags TEXT,
        is_public BOOLEAN DEFAULT 1,
        status TEXT DEFAULT 'approved',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        event_date DATE,
        location TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS gallery_reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        reaction_type TEXT NOT NULL,
        reactor_name TEXT NOT NULL,
        reactor_email TEXT,
        reactor_ip TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, reactor_name, reactor_ip)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS gallery_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        commenter_name TEXT NOT NULL,
        commenter_email TEXT,
        commenter_ip TEXT,
        comment_text TEXT NOT NULL,
        is_approved BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample posts
    const samplePosts = [
      {
        uploader_name: 'Sarah Johnson',
        uploader_email: 'sarah@example.com',
        title: 'Family Reunion 2020',
        caption: 'A wonderful day spent together as a family. Mary was so happy to see everyone together.',
        file_name: 'family-reunion-2020.jpg',
        original_file_name: 'IMG_20200715_143022.jpg',
        file_type: 'image',
        mime_type: 'image/jpeg',
        file_size: 2048000,
        file_path: '/uploads/gallery/family-reunion-2020.jpg',
        tags: JSON.stringify(['Family', 'Reunion', 'Memories']),
        is_public: 1,
        status: 'approved',
        event_date: '2020-07-15',
        location: 'Nairobi, Kenya'
      },
      {
        uploader_name: 'Michael Wangui',
        uploader_email: 'michael@example.com',
        title: 'Birthday Celebration',
        caption: 'Celebrating mom\'s 75th birthday with all her favorite things.',
        file_name: 'birthday-celebration.jpg',
        original_file_name: 'IMG_20231210_164500.jpg',
        file_type: 'image',
        mime_type: 'image/jpeg',
        file_size: 1536000,
        file_path: '/uploads/gallery/birthday-celebration.jpg',
        tags: JSON.stringify(['Birthday', 'Celebration', 'Family']),
        is_public: 1,
        status: 'approved',
        event_date: '2023-12-10',
        location: 'Home'
      },
      {
        uploader_name: 'Grace Kariuki',
        uploader_email: 'grace@example.com',
        title: 'Garden Memories',
        caption: 'Mary in her element - tending to her beautiful garden. She loved her flowers so much.',
        file_name: 'garden-memories.jpg',
        original_file_name: 'IMG_20230620_091500.jpg',
        file_type: 'image',
        mime_type: 'image/jpeg',
        file_size: 3072000,
        file_path: '/uploads/gallery/garden-memories.jpg',
        tags: JSON.stringify(['Garden', 'Nature', 'Memories']),
        is_public: 1,
        status: 'approved',
        event_date: '2023-06-20',
        location: 'Home Garden'
      },
      {
        uploader_name: 'David Mwangi',
        uploader_email: 'david@example.com',
        title: 'Cooking Together',
        caption: 'Mary teaching her grandchildren how to make her famous ugali. These moments are precious.',
        file_name: 'cooking-together.jpg',
        original_file_name: 'IMG_20231125_163000.jpg',
        file_type: 'image',
        mime_type: 'image/jpeg',
        file_size: 2560000,
        file_path: '/uploads/gallery/cooking-together.jpg',
        tags: JSON.stringify(['Cooking', 'Family', 'Teaching']),
        is_public: 1,
        status: 'approved',
        event_date: '2023-11-25',
        location: 'Kitchen'
      },
      {
        uploader_name: 'Anne Njoroge',
        uploader_email: 'anne@example.com',
        title: 'Sunday Church',
        caption: 'Mary always looked forward to Sundays. This was her happy place.',
        file_name: 'sunday-church.jpg',
        original_file_name: 'IMG_20231015_111500.jpg',
        file_type: 'image',
        mime_type: 'image/jpeg',
        file_size: 1792000,
        file_path: '/uploads/gallery/sunday-church.jpg',
        tags: JSON.stringify(['Church', 'Sunday', 'Faith']),
        is_public: 1,
        status: 'approved',
        event_date: '2023-10-15',
        location: 'Local Church'
      },
      {
        uploader_name: 'James Kamau',
        uploader_email: 'james@example.com',
        title: 'Video: Mary\'s Story',
        caption: 'A short video of Mary sharing her life story and memories.',
        file_name: 'marys-story.mp4',
        original_file_name: 'VID_20230901_134500.mp4',
        file_type: 'video',
        mime_type: 'video/mp4',
        file_size: 15258000,
        file_path: '/uploads/gallery/marys-story.mp4',
        tags: JSON.stringify(['Video', 'Story', 'Interview']),
        is_public: 1,
        status: 'approved',
        event_date: '2023-09-01',
        location: 'Living Room'
      }
    ];

    for (const post of samplePosts) {
      await db.run(`
        INSERT INTO gallery_posts (
          uploader_name, uploader_email, title, caption, file_name, original_file_name,
          file_type, mime_type, file_size, file_path, tags, is_public, status,
          event_date, location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        post.uploader_name,
        post.uploader_email,
        post.title,
        post.caption,
        post.file_name,
        post.original_file_name,
        post.file_type,
        post.mime_type,
        post.file_size,
        post.file_path,
        post.tags,
        post.is_public,
        post.status,
        post.event_date,
        post.location
      ]);
    }

    // Add sample reactions
    const reactions = [
      { post_id: 1, reaction_type: 'heart', reactor_name: 'John Doe' },
      { post_id: 1, reaction_type: 'like', reactor_name: 'Jane Smith' },
      { post_id: 2, reaction_type: 'heart', reactor_name: 'Bob Johnson' },
      { post_id: 2, reaction_type: 'love', reactor_name: 'Alice Brown' },
      { post_id: 3, reaction_type: 'heart', reactor_name: 'Charlie Wilson' },
      { post_id: 3, reaction_type: 'like', reactor_name: 'Diana Davis' },
      { post_id: 4, reaction_type: 'heart', reactor_name: 'Eve Martinez' },
      { post_id: 4, reaction_type: 'smile', reactor_name: 'Frank Garcia' },
      { post_id: 5, reaction_type: 'heart', reactor_name: 'Grace Lee' },
      { post_id: 5, reaction_type: 'pray', reactor_name: 'Henry Taylor' },
      { post_id: 6, reaction_type: 'heart', reactor_name: 'Ivy Chen' },
      { post_id: 6, reaction_type: 'love', reactor_name: 'Jack Wilson' },
    ];

    for (const reaction of reactions) {
      await db.run(`
        INSERT OR IGNORE INTO gallery_reactions (post_id, reaction_type, reactor_name, reactor_ip)
        VALUES (?, ?, ?, ?)
      `, [reaction.post_id, reaction.reaction_type, reaction.reactor_name, '127.0.0.1']);
    }

    // Add sample comments
    const comments = [
      { post_id: 1, commenter_name: 'Emily Chen', comment_text: 'Such beautiful memories! ❤️' },
      { post_id: 1, commenter_name: 'Frank Miller', comment_text: 'I remember this day so well.' },
      { post_id: 2, commenter_name: 'Grace Lee', comment_text: 'Happy birthday to the best mom!' },
      { post_id: 3, commenter_name: 'Henry Taylor', comment_text: 'Mary had such a green thumb!' },
      { post_id: 4, commenter_name: 'Ivy Martinez', comment_text: 'She taught me everything I know about cooking.' },
      { post_id: 5, commenter_name: 'Jack Wilson', comment_text: 'Mary loved her church community.' },
      { post_id: 6, commenter_name: 'Kate Brown', comment_text: 'This video is so precious. Thank you for sharing.' },
    ];

    for (const comment of comments) {
      await db.run(`
        INSERT INTO gallery_comments (post_id, commenter_name, comment_text, is_approved, commenter_ip)
        VALUES (?, ?, ?, ?, ?)
      `, [comment.post_id, comment.commenter_name, comment.comment_text, 1, '127.0.0.1']);
    }

    console.log('✅ Gallery seeded successfully with sample data!');
    console.log('📊 Added 6 posts, 12 reactions, and 7 comments');
    
  } catch (error) {
    console.error('❌ Error seeding gallery:', error);
    process.exit(1);
  }
}

seedGallery().then(() => {
  console.log('🎉 Gallery seeding completed!');
  process.exit(0);
}).catch(console.error);
