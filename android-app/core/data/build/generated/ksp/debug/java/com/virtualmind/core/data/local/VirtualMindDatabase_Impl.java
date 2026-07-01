package com.virtualmind.core.data.local;

import androidx.annotation.NonNull;
import androidx.room.DatabaseConfiguration;
import androidx.room.InvalidationTracker;
import androidx.room.RoomDatabase;
import androidx.room.RoomOpenHelper;
import androidx.room.migration.AutoMigrationSpec;
import androidx.room.migration.Migration;
import androidx.room.util.DBUtil;
import androidx.room.util.TableInfo;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteOpenHelper;
import com.virtualmind.core.data.local.dao.ContentItemDao;
import com.virtualmind.core.data.local.dao.ContentItemDao_Impl;
import com.virtualmind.core.data.local.dao.LogEntryDao;
import com.virtualmind.core.data.local.dao.LogEntryDao_Impl;
import com.virtualmind.core.data.local.dao.ProcessTaskDao;
import com.virtualmind.core.data.local.dao.ProcessTaskDao_Impl;
import com.virtualmind.core.data.local.dao.WorkoutDao;
import com.virtualmind.core.data.local.dao.WorkoutDao_Impl;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class VirtualMindDatabase_Impl extends VirtualMindDatabase {
  private volatile LogEntryDao _logEntryDao;

  private volatile ContentItemDao _contentItemDao;

  private volatile ProcessTaskDao _processTaskDao;

  private volatile WorkoutDao _workoutDao;

  @Override
  @NonNull
  protected SupportSQLiteOpenHelper createOpenHelper(@NonNull final DatabaseConfiguration config) {
    final SupportSQLiteOpenHelper.Callback _openCallback = new RoomOpenHelper(config, new RoomOpenHelper.Delegate(3) {
      @Override
      public void createAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS `log_entries` (`id` TEXT NOT NULL, `pillarId` TEXT NOT NULL, `content` TEXT NOT NULL, `timestamp` INTEGER NOT NULL, `isSystemGenerated` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `content_items` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `title` TEXT NOT NULL, `platform` TEXT NOT NULL, `status` TEXT NOT NULL, `scheduledDateMillis` INTEGER NOT NULL, `createdAtMillis` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `process_tasks` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `questionnaireAnswers` TEXT NOT NULL, `assignedMinutes` INTEGER NOT NULL, `status` TEXT NOT NULL, `remainingSeconds` INTEGER NOT NULL, `createdAtMillis` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `workout_split` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `name` TEXT NOT NULL, `description` TEXT)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `workout_exercise` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `splitId` INTEGER NOT NULL, `name` TEXT NOT NULL, `targetMuscle` TEXT NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `workout_session` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `splitId` INTEGER NOT NULL, `dateTimestamp` INTEGER NOT NULL, `isSynced` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `workout_set` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `sessionId` INTEGER NOT NULL, `exerciseId` INTEGER NOT NULL, `reps` INTEGER NOT NULL, `weight` REAL NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)");
        db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, 'a3760bd7409b9100a799650d77d0f9aa')");
      }

      @Override
      public void dropAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("DROP TABLE IF EXISTS `log_entries`");
        db.execSQL("DROP TABLE IF EXISTS `content_items`");
        db.execSQL("DROP TABLE IF EXISTS `process_tasks`");
        db.execSQL("DROP TABLE IF EXISTS `workout_split`");
        db.execSQL("DROP TABLE IF EXISTS `workout_exercise`");
        db.execSQL("DROP TABLE IF EXISTS `workout_session`");
        db.execSQL("DROP TABLE IF EXISTS `workout_set`");
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onDestructiveMigration(db);
          }
        }
      }

      @Override
      public void onCreate(@NonNull final SupportSQLiteDatabase db) {
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onCreate(db);
          }
        }
      }

      @Override
      public void onOpen(@NonNull final SupportSQLiteDatabase db) {
        mDatabase = db;
        internalInitInvalidationTracker(db);
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onOpen(db);
          }
        }
      }

      @Override
      public void onPreMigrate(@NonNull final SupportSQLiteDatabase db) {
        DBUtil.dropFtsSyncTriggers(db);
      }

      @Override
      public void onPostMigrate(@NonNull final SupportSQLiteDatabase db) {
      }

      @Override
      @NonNull
      public RoomOpenHelper.ValidationResult onValidateSchema(
          @NonNull final SupportSQLiteDatabase db) {
        final HashMap<String, TableInfo.Column> _columnsLogEntries = new HashMap<String, TableInfo.Column>(5);
        _columnsLogEntries.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsLogEntries.put("pillarId", new TableInfo.Column("pillarId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsLogEntries.put("content", new TableInfo.Column("content", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsLogEntries.put("timestamp", new TableInfo.Column("timestamp", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsLogEntries.put("isSystemGenerated", new TableInfo.Column("isSystemGenerated", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysLogEntries = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesLogEntries = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoLogEntries = new TableInfo("log_entries", _columnsLogEntries, _foreignKeysLogEntries, _indicesLogEntries);
        final TableInfo _existingLogEntries = TableInfo.read(db, "log_entries");
        if (!_infoLogEntries.equals(_existingLogEntries)) {
          return new RoomOpenHelper.ValidationResult(false, "log_entries(com.virtualmind.core.data.local.entity.LogEntryEntity).\n"
                  + " Expected:\n" + _infoLogEntries + "\n"
                  + " Found:\n" + _existingLogEntries);
        }
        final HashMap<String, TableInfo.Column> _columnsContentItems = new HashMap<String, TableInfo.Column>(6);
        _columnsContentItems.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsContentItems.put("title", new TableInfo.Column("title", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsContentItems.put("platform", new TableInfo.Column("platform", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsContentItems.put("status", new TableInfo.Column("status", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsContentItems.put("scheduledDateMillis", new TableInfo.Column("scheduledDateMillis", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsContentItems.put("createdAtMillis", new TableInfo.Column("createdAtMillis", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysContentItems = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesContentItems = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoContentItems = new TableInfo("content_items", _columnsContentItems, _foreignKeysContentItems, _indicesContentItems);
        final TableInfo _existingContentItems = TableInfo.read(db, "content_items");
        if (!_infoContentItems.equals(_existingContentItems)) {
          return new RoomOpenHelper.ValidationResult(false, "content_items(com.virtualmind.core.data.local.entity.ContentItemEntity).\n"
                  + " Expected:\n" + _infoContentItems + "\n"
                  + " Found:\n" + _existingContentItems);
        }
        final HashMap<String, TableInfo.Column> _columnsProcessTasks = new HashMap<String, TableInfo.Column>(6);
        _columnsProcessTasks.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProcessTasks.put("questionnaireAnswers", new TableInfo.Column("questionnaireAnswers", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProcessTasks.put("assignedMinutes", new TableInfo.Column("assignedMinutes", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProcessTasks.put("status", new TableInfo.Column("status", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProcessTasks.put("remainingSeconds", new TableInfo.Column("remainingSeconds", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsProcessTasks.put("createdAtMillis", new TableInfo.Column("createdAtMillis", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysProcessTasks = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesProcessTasks = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoProcessTasks = new TableInfo("process_tasks", _columnsProcessTasks, _foreignKeysProcessTasks, _indicesProcessTasks);
        final TableInfo _existingProcessTasks = TableInfo.read(db, "process_tasks");
        if (!_infoProcessTasks.equals(_existingProcessTasks)) {
          return new RoomOpenHelper.ValidationResult(false, "process_tasks(com.virtualmind.core.data.local.entity.ProcessTaskEntity).\n"
                  + " Expected:\n" + _infoProcessTasks + "\n"
                  + " Found:\n" + _existingProcessTasks);
        }
        final HashMap<String, TableInfo.Column> _columnsWorkoutSplit = new HashMap<String, TableInfo.Column>(3);
        _columnsWorkoutSplit.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsWorkoutSplit.put("name", new TableInfo.Column("name", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsWorkoutSplit.put("description", new TableInfo.Column("description", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysWorkoutSplit = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesWorkoutSplit = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoWorkoutSplit = new TableInfo("workout_split", _columnsWorkoutSplit, _foreignKeysWorkoutSplit, _indicesWorkoutSplit);
        final TableInfo _existingWorkoutSplit = TableInfo.read(db, "workout_split");
        if (!_infoWorkoutSplit.equals(_existingWorkoutSplit)) {
          return new RoomOpenHelper.ValidationResult(false, "workout_split(com.virtualmind.core.data.local.entity.WorkoutSplitEntity).\n"
                  + " Expected:\n" + _infoWorkoutSplit + "\n"
                  + " Found:\n" + _existingWorkoutSplit);
        }
        final HashMap<String, TableInfo.Column> _columnsWorkoutExercise = new HashMap<String, TableInfo.Column>(4);
        _columnsWorkoutExercise.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsWorkoutExercise.put("splitId", new TableInfo.Column("splitId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsWorkoutExercise.put("name", new TableInfo.Column("name", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsWorkoutExercise.put("targetMuscle", new TableInfo.Column("targetMuscle", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysWorkoutExercise = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesWorkoutExercise = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoWorkoutExercise = new TableInfo("workout_exercise", _columnsWorkoutExercise, _foreignKeysWorkoutExercise, _indicesWorkoutExercise);
        final TableInfo _existingWorkoutExercise = TableInfo.read(db, "workout_exercise");
        if (!_infoWorkoutExercise.equals(_existingWorkoutExercise)) {
          return new RoomOpenHelper.ValidationResult(false, "workout_exercise(com.virtualmind.core.data.local.entity.WorkoutExerciseEntity).\n"
                  + " Expected:\n" + _infoWorkoutExercise + "\n"
                  + " Found:\n" + _existingWorkoutExercise);
        }
        final HashMap<String, TableInfo.Column> _columnsWorkoutSession = new HashMap<String, TableInfo.Column>(4);
        _columnsWorkoutSession.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsWorkoutSession.put("splitId", new TableInfo.Column("splitId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsWorkoutSession.put("dateTimestamp", new TableInfo.Column("dateTimestamp", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsWorkoutSession.put("isSynced", new TableInfo.Column("isSynced", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysWorkoutSession = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesWorkoutSession = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoWorkoutSession = new TableInfo("workout_session", _columnsWorkoutSession, _foreignKeysWorkoutSession, _indicesWorkoutSession);
        final TableInfo _existingWorkoutSession = TableInfo.read(db, "workout_session");
        if (!_infoWorkoutSession.equals(_existingWorkoutSession)) {
          return new RoomOpenHelper.ValidationResult(false, "workout_session(com.virtualmind.core.data.local.entity.WorkoutSessionEntity).\n"
                  + " Expected:\n" + _infoWorkoutSession + "\n"
                  + " Found:\n" + _existingWorkoutSession);
        }
        final HashMap<String, TableInfo.Column> _columnsWorkoutSet = new HashMap<String, TableInfo.Column>(5);
        _columnsWorkoutSet.put("id", new TableInfo.Column("id", "INTEGER", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsWorkoutSet.put("sessionId", new TableInfo.Column("sessionId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsWorkoutSet.put("exerciseId", new TableInfo.Column("exerciseId", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsWorkoutSet.put("reps", new TableInfo.Column("reps", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsWorkoutSet.put("weight", new TableInfo.Column("weight", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysWorkoutSet = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesWorkoutSet = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoWorkoutSet = new TableInfo("workout_set", _columnsWorkoutSet, _foreignKeysWorkoutSet, _indicesWorkoutSet);
        final TableInfo _existingWorkoutSet = TableInfo.read(db, "workout_set");
        if (!_infoWorkoutSet.equals(_existingWorkoutSet)) {
          return new RoomOpenHelper.ValidationResult(false, "workout_set(com.virtualmind.core.data.local.entity.WorkoutSetEntity).\n"
                  + " Expected:\n" + _infoWorkoutSet + "\n"
                  + " Found:\n" + _existingWorkoutSet);
        }
        return new RoomOpenHelper.ValidationResult(true, null);
      }
    }, "a3760bd7409b9100a799650d77d0f9aa", "aee419fc3cb0db2f6be9f3bd9e66865a");
    final SupportSQLiteOpenHelper.Configuration _sqliteConfig = SupportSQLiteOpenHelper.Configuration.builder(config.context).name(config.name).callback(_openCallback).build();
    final SupportSQLiteOpenHelper _helper = config.sqliteOpenHelperFactory.create(_sqliteConfig);
    return _helper;
  }

  @Override
  @NonNull
  protected InvalidationTracker createInvalidationTracker() {
    final HashMap<String, String> _shadowTablesMap = new HashMap<String, String>(0);
    final HashMap<String, Set<String>> _viewTables = new HashMap<String, Set<String>>(0);
    return new InvalidationTracker(this, _shadowTablesMap, _viewTables, "log_entries","content_items","process_tasks","workout_split","workout_exercise","workout_session","workout_set");
  }

  @Override
  public void clearAllTables() {
    super.assertNotMainThread();
    final SupportSQLiteDatabase _db = super.getOpenHelper().getWritableDatabase();
    try {
      super.beginTransaction();
      _db.execSQL("DELETE FROM `log_entries`");
      _db.execSQL("DELETE FROM `content_items`");
      _db.execSQL("DELETE FROM `process_tasks`");
      _db.execSQL("DELETE FROM `workout_split`");
      _db.execSQL("DELETE FROM `workout_exercise`");
      _db.execSQL("DELETE FROM `workout_session`");
      _db.execSQL("DELETE FROM `workout_set`");
      super.setTransactionSuccessful();
    } finally {
      super.endTransaction();
      _db.query("PRAGMA wal_checkpoint(FULL)").close();
      if (!_db.inTransaction()) {
        _db.execSQL("VACUUM");
      }
    }
  }

  @Override
  @NonNull
  protected Map<Class<?>, List<Class<?>>> getRequiredTypeConverters() {
    final HashMap<Class<?>, List<Class<?>>> _typeConvertersMap = new HashMap<Class<?>, List<Class<?>>>();
    _typeConvertersMap.put(LogEntryDao.class, LogEntryDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(ContentItemDao.class, ContentItemDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(ProcessTaskDao.class, ProcessTaskDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(WorkoutDao.class, WorkoutDao_Impl.getRequiredConverters());
    return _typeConvertersMap;
  }

  @Override
  @NonNull
  public Set<Class<? extends AutoMigrationSpec>> getRequiredAutoMigrationSpecs() {
    final HashSet<Class<? extends AutoMigrationSpec>> _autoMigrationSpecsSet = new HashSet<Class<? extends AutoMigrationSpec>>();
    return _autoMigrationSpecsSet;
  }

  @Override
  @NonNull
  public List<Migration> getAutoMigrations(
      @NonNull final Map<Class<? extends AutoMigrationSpec>, AutoMigrationSpec> autoMigrationSpecs) {
    final List<Migration> _autoMigrations = new ArrayList<Migration>();
    return _autoMigrations;
  }

  @Override
  public LogEntryDao logEntryDao() {
    if (_logEntryDao != null) {
      return _logEntryDao;
    } else {
      synchronized(this) {
        if(_logEntryDao == null) {
          _logEntryDao = new LogEntryDao_Impl(this);
        }
        return _logEntryDao;
      }
    }
  }

  @Override
  public ContentItemDao contentItemDao() {
    if (_contentItemDao != null) {
      return _contentItemDao;
    } else {
      synchronized(this) {
        if(_contentItemDao == null) {
          _contentItemDao = new ContentItemDao_Impl(this);
        }
        return _contentItemDao;
      }
    }
  }

  @Override
  public ProcessTaskDao processTaskDao() {
    if (_processTaskDao != null) {
      return _processTaskDao;
    } else {
      synchronized(this) {
        if(_processTaskDao == null) {
          _processTaskDao = new ProcessTaskDao_Impl(this);
        }
        return _processTaskDao;
      }
    }
  }

  @Override
  public WorkoutDao workoutDao() {
    if (_workoutDao != null) {
      return _workoutDao;
    } else {
      synchronized(this) {
        if(_workoutDao == null) {
          _workoutDao = new WorkoutDao_Impl(this);
        }
        return _workoutDao;
      }
    }
  }
}
