package com.virtualmind.core.data.di;

import com.virtualmind.core.data.local.VirtualMindDatabase;
import com.virtualmind.core.data.local.dao.WorkoutDao;
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
public final class DatabaseModule_ProvidesWorkoutDaoFactory implements Factory<WorkoutDao> {
  private final Provider<VirtualMindDatabase> databaseProvider;

  public DatabaseModule_ProvidesWorkoutDaoFactory(Provider<VirtualMindDatabase> databaseProvider) {
    this.databaseProvider = databaseProvider;
  }

  @Override
  public WorkoutDao get() {
    return providesWorkoutDao(databaseProvider.get());
  }

  public static DatabaseModule_ProvidesWorkoutDaoFactory create(
      Provider<VirtualMindDatabase> databaseProvider) {
    return new DatabaseModule_ProvidesWorkoutDaoFactory(databaseProvider);
  }

  public static WorkoutDao providesWorkoutDao(VirtualMindDatabase database) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.providesWorkoutDao(database));
  }
}
