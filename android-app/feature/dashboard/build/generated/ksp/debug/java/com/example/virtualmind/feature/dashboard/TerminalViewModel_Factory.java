package com.example.virtualmind.feature.dashboard;

import com.virtualmind.core.data.repository.LogRepository;
import com.virtualmind.core.network.NetworkTerminalDataSource;
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
public final class TerminalViewModel_Factory implements Factory<TerminalViewModel> {
  private final Provider<LogRepository> logRepositoryProvider;

  private final Provider<NetworkTerminalDataSource> networkTerminalDataSourceProvider;

  public TerminalViewModel_Factory(Provider<LogRepository> logRepositoryProvider,
      Provider<NetworkTerminalDataSource> networkTerminalDataSourceProvider) {
    this.logRepositoryProvider = logRepositoryProvider;
    this.networkTerminalDataSourceProvider = networkTerminalDataSourceProvider;
  }

  @Override
  public TerminalViewModel get() {
    return newInstance(logRepositoryProvider.get(), networkTerminalDataSourceProvider.get());
  }

  public static TerminalViewModel_Factory create(Provider<LogRepository> logRepositoryProvider,
      Provider<NetworkTerminalDataSource> networkTerminalDataSourceProvider) {
    return new TerminalViewModel_Factory(logRepositoryProvider, networkTerminalDataSourceProvider);
  }

  public static TerminalViewModel newInstance(LogRepository logRepository,
      NetworkTerminalDataSource networkTerminalDataSource) {
    return new TerminalViewModel(logRepository, networkTerminalDataSource);
  }
}
