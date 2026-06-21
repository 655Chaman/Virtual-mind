package com.example.virtualmind.feature.dashboard;

import android.content.Context;
import com.virtualmind.core.network.LogsApi;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata
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
public final class SelfViewModel_Factory implements Factory<SelfViewModel> {
  private final Provider<Context> contextProvider;

  private final Provider<LogsApi> logsApiProvider;

  public SelfViewModel_Factory(Provider<Context> contextProvider,
      Provider<LogsApi> logsApiProvider) {
    this.contextProvider = contextProvider;
    this.logsApiProvider = logsApiProvider;
  }

  @Override
  public SelfViewModel get() {
    return newInstance(contextProvider.get(), logsApiProvider.get());
  }

  public static SelfViewModel_Factory create(Provider<Context> contextProvider,
      Provider<LogsApi> logsApiProvider) {
    return new SelfViewModel_Factory(contextProvider, logsApiProvider);
  }

  public static SelfViewModel newInstance(Context context, LogsApi logsApi) {
    return new SelfViewModel(context, logsApi);
  }
}
