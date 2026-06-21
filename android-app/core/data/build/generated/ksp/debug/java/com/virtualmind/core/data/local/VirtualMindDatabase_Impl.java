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

  @Override
  @NonNull
  protected SupportSQLiteOpenHelper createOpenHelper(@NonNull final DatabaseConfiguration config) {
    final SupportSQLiteOpenHelper.Callback _openCallback = new RoomOpenHelper(config, new RoomOpenHelper.Delegate(2) {
      @Override
      public void createAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS `log_entries` (`id` TEXT NOT NULL, `pillarId` TEXT NOT NULL, `content` TEXT NOT NULL, `timestamp` INTEGER NOT NULL, `isSystemGenerated` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `content_items` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `title` TEXT NOT NULL, `platform` TEXT NOT NULL, `status` TEXT NOT NULL, `scheduledDateMillis` INTEGER NOT NULL, `createdAtMillis` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS `process_tasks` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `questionnaireAnswers` TEXT NOT NULL, `assignedMinutes` INTEGER NOT NULL, `status` TEXT NOT NULL, `remainingSeconds` INTEGER NOT NULL, `createdAtMillis` INTEGER NOT NULL)");
        db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)");
        db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, 'cdf098a44004548c1ee8e7207c022e15')");
      }

      @Override
      public void dropAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("DROP TABLE IF EXISTS `log_entries`");
        db.execSQL("DROP TABLE IF EXISTS `content_items`");
        db.execSQL("DROP TABLE IF EXISTS `process_tasks`");
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
        return new RoomOpenHelper.ValidationResult(true, null);
      }
    }, "cdf098a44004548c1ee8e7207c022e15", "e40b003fa7fbd9cfbcfcb338669e5aac");
    final SupportSQLiteOpenHelper.Configuration _sqliteConfig = SupportSQLiteOpenHelper.Configuration.builder(config.context).name(config.name).callback(_openCallback).build();
    final SupportSQLiteOpenHelper _helper = config.sqliteOpenHelperFactory.create(_sqliteConfig);
    return _helper;
  }

  @Override
  @NonNull
  protected InvalidationTracker createInvalidationTracker() {
    final HashMap<String, String> _shadowTablesMap = new HashMap<String, String>(0);
    final HashMap<String, Set<String>> _viewTables = new HashMap<String, Set<String>>(0);
    return new InvalidationTracker(this, _shadowTablesMap, _viewTables, "log_entries","content_items","process_tasks");
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
}
