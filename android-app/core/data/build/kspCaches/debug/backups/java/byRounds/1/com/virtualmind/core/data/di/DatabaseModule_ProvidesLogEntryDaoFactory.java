package com.virtualmind.core.data.di;

import com.virtualmind.core.data.local.VirtualMindDatabase;
import com.virtualmind.core.data.local.dao.LogEntryDao;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
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
public final class DatabaseModule_ProvidesLogEntryDaoFactory implements Factory<LogEntryDao> {
  private final Provider<VirtualMindDatabase> databaseProvider;

  public DatabaseModule_ProvidesLogEntryDaoFactory(Provider<VirtualMindDatabase> databaseProvider) {
    this.databaseProvider = databaseProvider;
  }

  @Override
  public LogEntryDao get() {
    return providesLogEntryDao(databaseProvider.get());
  }

  public static DatabaseModule_ProvidesLogEntryDaoFactory create(
      Provider<VirtualMindDatabase> databaseProvider) {
    return new DatabaseModule_ProvidesLogEntryDaoFactory(databaseProvider);
  }

  public static LogEntryDao providesLogEntryDao(VirtualMindDatabase database) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.providesLogEntryDao(database));
  }
}
