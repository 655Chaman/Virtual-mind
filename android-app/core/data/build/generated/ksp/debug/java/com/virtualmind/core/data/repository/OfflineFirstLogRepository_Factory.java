package com.virtualmind.core.data.repository;

import com.virtualmind.core.data.local.dao.LogEntryDao;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class OfflineFirstLogRepository_Factory implements Factory<OfflineFirstLogRepository> {
  private final Provider<LogEntryDao> logEntryDaoProvider;

  public OfflineFirstLogRepository_Factory(Provider<LogEntryDao> logEntryDaoProvider) {
    this.logEntryDaoProvider = logEntryDaoProvider;
  }

  @Override
  public OfflineFirstLogRepository get() {
    return newInstance(logEntryDaoProvider.get());
  }

  public static OfflineFirstLogRepository_Factory create(
      Provider<LogEntryDao> logEntryDaoProvider) {
    return new OfflineFirstLogRepository_Factory(logEntryDaoProvider);
  }

  public static OfflineFirstLogRepository newInstance(LogEntryDao logEntryDao) {
    return new OfflineFirstLogRepository(logEntryDao);
  }
}
