package com.virtualmind.core.data.local.dao;

import android.database.Cursor;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.virtualmind.core.data.local.entity.ProcessTaskEntity;
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
public final class ProcessTaskDao_Impl implements ProcessTaskDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<ProcessTaskEntity> __insertionAdapterOfProcessTaskEntity;

  private final EntityDeletionOrUpdateAdapter<ProcessTaskEntity> __deletionAdapterOfProcessTaskEntity;

  private final EntityDeletionOrUpdateAdapter<ProcessTaskEntity> __updateAdapterOfProcessTaskEntity;

  public ProcessTaskDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfProcessTaskEntity = new EntityInsertionAdapter<ProcessTaskEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `process_tasks` (`id`,`questionnaireAnswers`,`assignedMinutes`,`status`,`remainingSeconds`,`createdAtMillis`) VALUES (nullif(?, 0),?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ProcessTaskEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getQuestionnaireAnswers());
        statement.bindLong(3, entity.getAssignedMinutes());
        statement.bindString(4, entity.getStatus());
        statement.bindLong(5, entity.getRemainingSeconds());
        statement.bindLong(6, entity.getCreatedAtMillis());
      }
    };
    this.__deletionAdapterOfProcessTaskEntity = new EntityDeletionOrUpdateAdapter<ProcessTaskEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `process_tasks` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ProcessTaskEntity entity) {
        statement.bindLong(1, entity.getId());
      }
    };
    this.__updateAdapterOfProcessTaskEntity = new EntityDeletionOrUpdateAdapter<ProcessTaskEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `process_tasks` SET `id` = ?,`questionnaireAnswers` = ?,`assignedMinutes` = ?,`status` = ?,`remainingSeconds` = ?,`createdAtMillis` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final ProcessTaskEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getQuestionnaireAnswers());
        statement.bindLong(3, entity.getAssignedMinutes());
        statement.bindString(4, entity.getStatus());
        statement.bindLong(5, entity.getRemainingSeconds());
        statement.bindLong(6, entity.getCreatedAtMillis());
        statement.bindLong(7, entity.getId());
      }
    };
  }

  @Override
  public Object insertProcessTask(final ProcessTaskEntity task,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfProcessTaskEntity.insert(task);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteProcessTask(final ProcessTaskEntity task,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfProcessTaskEntity.handle(task);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object updateProcessTask(final ProcessTaskEntity task,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfProcessTaskEntity.handle(task);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<ProcessTaskEntity>> getAllProcessTasks() {
    final String _sql = "SELECT * FROM process_tasks ORDER BY createdAtMillis DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"process_tasks"}, new Callable<List<ProcessTaskEntity>>() {
      @Override
      @NonNull
      public List<ProcessTaskEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfQuestionnaireAnswers = CursorUtil.getColumnIndexOrThrow(_cursor, "questionnaireAnswers");
          final int _cursorIndexOfAssignedMinutes = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedMinutes");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfRemainingSeconds = CursorUtil.getColumnIndexOrThrow(_cursor, "remainingSeconds");
          final int _cursorIndexOfCreatedAtMillis = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAtMillis");
          final List<ProcessTaskEntity> _result = new ArrayList<ProcessTaskEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ProcessTaskEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpQuestionnaireAnswers;
            _tmpQuestionnaireAnswers = _cursor.getString(_cursorIndexOfQuestionnaireAnswers);
            final int _tmpAssignedMinutes;
            _tmpAssignedMinutes = _cursor.getInt(_cursorIndexOfAssignedMinutes);
            final String _tmpStatus;
            _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
            final int _tmpRemainingSeconds;
            _tmpRemainingSeconds = _cursor.getInt(_cursorIndexOfRemainingSeconds);
            final long _tmpCreatedAtMillis;
            _tmpCreatedAtMillis = _cursor.getLong(_cursorIndexOfCreatedAtMillis);
            _item = new ProcessTaskEntity(_tmpId,_tmpQuestionnaireAnswers,_tmpAssignedMinutes,_tmpStatus,_tmpRemainingSeconds,_tmpCreatedAtMillis);
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
