package com.example.virtualmind.feature.dashboard;

import com.virtualmind.core.network.DeenApi;
import com.virtualmind.core.network.LogsApi;
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
public final class DeenViewModel_Factory implements Factory<DeenViewModel> {
  private final Provider<DeenApi> deenApiProvider;

  private final Provider<LogsApi> logsApiProvider;

  public DeenViewModel_Factory(Provider<DeenApi> deenApiProvider,
      Provider<LogsApi> logsApiProvider) {
    this.deenApiProvider = deenApiProvider;
    this.logsApiProvider = logsApiProvider;
  }

  @Override
  public DeenViewModel get() {
    return newInstance(deenApiProvider.get(), logsApiProvider.get());
  }

  public static DeenViewModel_Factory create(Provider<DeenApi> deenApiProvider,
      Provider<LogsApi> logsApiProvider) {
    return new DeenViewModel_Factory(deenApiProvider, logsApiProvider);
  }

  public static DeenViewModel newInstance(DeenApi deenApi, LogsApi logsApi) {
    return new DeenViewModel(deenApi, logsApi);
  }
}
