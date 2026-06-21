package com.virtualmind.core.data.di;

import com.virtualmind.core.data.local.VirtualMindDatabase;
import com.virtualmind.core.data.local.dao.ProcessTaskDao;
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
public final class DatabaseModule_ProvidesProcessTaskDaoFactory implements Factory<ProcessTaskDao> {
  private final Provider<VirtualMindDatabase> databaseProvider;

  public DatabaseModule_ProvidesProcessTaskDaoFactory(
      Provider<VirtualMindDatabase> databaseProvider) {
    this.databaseProvider = databaseProvider;
  }

  @Override
  public ProcessTaskDao get() {
    return providesProcessTaskDao(databaseProvider.get());
  }

  public static DatabaseModule_ProvidesProcessTaskDaoFactory create(
      Provider<VirtualMindDatabase> databaseProvider) {
    return new DatabaseModule_ProvidesProcessTaskDaoFactory(databaseProvider);
  }

  public static ProcessTaskDao providesProcessTaskDao(VirtualMindDatabase database) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.providesProcessTaskDao(database));
  }
}
