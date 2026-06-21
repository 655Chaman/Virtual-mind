package com.example.virtualmind.feature.dashboard;

import com.virtualmind.core.network.FitnessApi;
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
public final class FitnessViewModel_Factory implements Factory<FitnessViewModel> {
  private final Provider<FitnessApi> fitnessApiProvider;

  public FitnessViewModel_Factory(Provider<FitnessApi> fitnessApiProvider) {
    this.fitnessApiProvider = fitnessApiProvider;
  }

  @Override
  public FitnessViewModel get() {
    return newInstance(fitnessApiProvider.get());
  }

  public static FitnessViewModel_Factory create(Provider<FitnessApi> fitnessApiProvider) {
    return new FitnessViewModel_Factory(fitnessApiProvider);
  }

  public static FitnessViewModel newInstance(FitnessApi fitnessApi) {
    return new FitnessViewModel(fitnessApi);
  }
}
