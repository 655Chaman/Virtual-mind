package com.virtualmind.core.data.local.dao;

import android.database.Cursor;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.virtualmind.core.data.local.entity.LogEntryEntity;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;
import kotlinx.coroutines.flow.Flow;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class LogEntryDao_Impl implements LogEntryDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<LogEntryEntity> __insertionAdapterOfLogEntryEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteLogEntry;

  public LogEntryDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfLogEntryEntity = new EntityInsertionAdapter<LogEntryEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `log_entries` (`id`,`pillarId`,`content`,`timestamp`,`isSystemGenerated`) VALUES (?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final LogEntryEntity entity) {
        statement.bindString(1, entity.getId());
        statement.bindString(2, entity.getPillarId());
        statement.bindString(3, entity.getContent());
        statement.bindLong(4, entity.getTimestamp());
        final int _tmp = entity.isSystemGenerated() ? 1 : 0;
        statement.bindLong(5, _tmp);
      }
    };
    this.__preparedStmtOfDeleteLogEntry = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM log_entries WHERE id = ?";
        return _query;
      }
    };
  }

  @Override
  public Object insertLogEntry(final LogEntryEntity logEntry,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfLogEntryEntity.insert(logEntry);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteLogEntry(final String id, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteLogEntry.acquire();
        int _argIndex = 1;
        _stmt.bindString(_argIndex, id);
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfDeleteLogEntry.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<LogEntryEntity>> getLogEntriesForPillar(final String pillarId) {
    final String _sql = "SELECT * FROM log_entries WHERE pillarId = ? ORDER BY timestamp DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindString(_argIndex, pillarId);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"log_entries"}, new Callable<List<LogEntryEntity>>() {
      @Override
      @NonNull
      public List<LogEntryEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfPillarId = CursorUtil.getColumnIndexOrThrow(_cursor, "pillarId");
          final int _cursorIndexOfContent = CursorUtil.getColumnIndexOrThrow(_cursor, "content");
          final int _cursorIndexOfTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "timestamp");
          final int _cursorIndexOfIsSystemGenerated = CursorUtil.getColumnIndexOrThrow(_cursor, "isSystemGenerated");
          final List<LogEntryEntity> _result = new ArrayList<LogEntryEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final LogEntryEntity _item;
            final String _tmpId;
            _tmpId = _cursor.getString(_cursorIndexOfId);
            final String _tmpPillarId;
            _tmpPillarId = _cursor.getString(_cursorIndexOfPillarId);
            final String _tmpContent;
            _tmpContent = _cursor.getString(_cursorIndexOfContent);
            final long _tmpTimestamp;
            _tmpTimestamp = _cursor.getLong(_cursorIndexOfTimestamp);
            final boolean _tmpIsSystemGenerated;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsSystemGenerated);
            _tmpIsSystemGenerated = _tmp != 0;
            _item = new LogEntryEntity(_tmpId,_tmpPillarId,_tmpContent,_tmpTimestamp,_tmpIsSystemGenerated);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
