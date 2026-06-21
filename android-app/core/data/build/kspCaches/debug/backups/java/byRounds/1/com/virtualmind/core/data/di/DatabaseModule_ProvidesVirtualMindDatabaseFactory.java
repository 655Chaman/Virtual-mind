package com.virtualmind.core.data.di;

import android.content.Context;
import com.virtualmind.core.data.local.VirtualMindDatabase;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
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
public final class DatabaseModule_ProvidesVirtualMindDatabaseFactory implements Factory<VirtualMindDatabase> {
  private final Provider<Context> contextProvider;

  public DatabaseModule_ProvidesVirtualMindDatabaseFactory(Provider<Context> contextProvider) {
    this.contextProvider = contextProvider;
  }

  @Override
  public VirtualMindDatabase get() {
    return providesVirtualMindDatabase(contextProvider.get());
  }

  public static DatabaseModule_ProvidesVirtualMindDatabaseFactory create(
      Provider<Context> contextProvider) {
    return new DatabaseModule_ProvidesVirtualMindDatabaseFactory(contextProvider);
  }

  public static VirtualMindDatabase providesVirtualMindDatabase(Context context) {
    return Preconditions.checkNotNullFromProvides(DatabaseModule.INSTANCE.providesVirtualMindDatabase(context));
  }
}
