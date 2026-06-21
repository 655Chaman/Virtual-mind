package com.virtualmind.core.data.di;

import com.virtualmind.core.data.local.VirtualMindDatabase;
import com.virtualmind.core.data.local.dao.ContentItemDao;
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
public final class DatabaseModule_ProvidesContentItemDaoFactory implements Factory<ContentItemDao> {
  private final Provider<VirtualMindDatabase> databaseProvider;

  public DatabaseModule_ProvidesContentItemDaoFactory(
      Provider<VirtualMindDatabase> databaseProvider) {
    this.databaseProvider = databaseProvider;
  }

  @Override
  public ContentItemDao get() {
    return providesContentItemDao(databaseProvider.get());
  }

  public static DatabaseModule_ProvidesContentItemDaoFactory create(
      Provider<VirtualMindDatabase> databaseProvider) {
    return new DatabaseModule_ProvidesContentItemDaoFactory(databaseProvider);
  }

  public static ContentItemDao providesContentItemDao(VirtualMindDatabase database) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.providesContentItemDao(database));
  }
}
