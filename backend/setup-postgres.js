import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'everbloom',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  try {
    console.log('🔧 Setting up PostgreSQL database for Everbloom Gallery...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'gallery-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Connect to database and execute schema
    const client = await pool.connect();
    
    try {
      console.log('📝 Creating gallery tables...');
      await client.query(schema);
      console.log('✅ Gallery tables created successfully!');
      
      // Insert some sample data
      console.log('📸 Inserting sample gallery posts...');
      await insertSampleData(client);
      console.log('✅ Sample data inserted successfully!');
      
    } finally {
      client.release();
    }
    
    console.log('🎉 PostgreSQL setup completed!');
    console.log('📊 Database is ready for gallery uploads!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function insertSampleData(client) {
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
      tags: ['Family', 'Reunion', 'Memories'],
      is_public: true,
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
      tags: ['Birthday', 'Celebration', 'Family'],
      is_public: true,
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
      tags: ['Garden', 'Nature', 'Memories'],
      is_public: true,
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
      tags: ['Cooking', 'Family', 'Teaching'],
      is_public: true,
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
      tags: ['Church', 'Sunday', 'Faith'],
      is_public: true,
      status: 'approved',
      event_date: '2023-10-15',
      location: 'Local Church'
    }
  ];

  for (const post of samplePosts) {
    await client.query(`
      INSERT INTO gallery_posts (
        uploader_name, uploader_email, title, caption, file_name, original_file_name,
        file_type, mime_type, file_size, file_path, tags, is_public, status,
        event_date, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
      JSON.stringify(post.tags),
      post.is_public,
      post.status,
      post.event_date,
      post.location
    ]);
  }

  // Add some sample reactions
  const reactions = [
    { post_id: 1, reaction_type: 'heart', reactor_name: 'John Doe' },
    { post_id: 1, reaction_type: 'like', reactor_name: 'Jane Smith' },
    { post_id: 2, reaction_type: 'heart', reactor_name: 'Bob Johnson' },
    { post_id: 2, reaction_type: 'love', reactor_name: 'Alice Brown' },
    { post_id: 3, reaction_type: 'heart', reactor_name: 'Charlie Wilson' },
    { post_id: 3, reaction_type: 'like', reactor_name: 'Diana Davis' },
  ];

  for (const reaction of reactions) {
    await client.query(`
      INSERT INTO gallery_reactions (post_id, reaction_type, reactor_name, reactor_ip)
      VALUES ($1, $2, $3, $4)
    `, [reaction.post_id, reaction.reaction_type, reaction.reactor_name, '127.0.0.1']);
  }

  // Add some sample comments
  const comments = [
    { post_id: 1, commenter_name: 'Emily Chen', comment_text: 'Such beautiful memories! ❤️' },
    { post_id: 1, commenter_name: 'Frank Miller', comment_text: 'I remember this day so well.' },
    { post_id: 2, commenter_name: 'Grace Lee', comment_text: 'Happy birthday to the best mom!' },
    { post_id: 3, commenter_name: 'Henry Taylor', comment_text: 'Mary had such a green thumb!' },
  ];

  for (const comment of comments) {
    await client.query(`
      INSERT INTO gallery_comments (post_id, commenter_name, comment_text, is_approved, commenter_ip)
      VALUES ($1, $2, $3, $4, $5)
    `, [comment.post_id, comment.commenter_name, comment.comment_text, true, '127.0.0.1']);
  }
}

// Run the setup
setupDatabase().catch(console.error);
