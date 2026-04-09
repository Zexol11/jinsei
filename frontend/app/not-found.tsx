'use client';

import Link from 'next/link';
import NatureBackground from '@/components/NatureBackground';
import styles from '@/components/auth.module.css';

export default function NotFound() {
  return (
    <NatureBackground>
      <div className={styles.formWrapper} style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p className={styles.wordmark} style={{ marginBottom: '10px', fontSize: '4rem' }}>404</p>
        <p className={styles.tagline} style={{ marginBottom: '30px' }}>Page Not Found</p>
        <p style={{ color: '#4E6952', marginBottom: '40px' }}>
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/" 
          style={{
            display: 'inline-block',
            backgroundColor: '#4E6952',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3b513e'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4E6952'}
        >
          Return Home
        </Link>
      </div>
    </NatureBackground>
  );
}
