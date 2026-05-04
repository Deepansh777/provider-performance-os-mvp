"""
Database connection utilities
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager


def get_db_connection():
    """Create a database connection"""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "db"),
        database=os.getenv("DB_NAME", "vbp_database"),
        user=os.getenv("DB_USER", "vbp_user"),
        password=os.getenv("DB_PASSWORD", "vbp_password"),
        port=os.getenv("DB_PORT", "5432")
    )


@contextmanager
def get_db_cursor():
    """Context manager for database cursor"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
