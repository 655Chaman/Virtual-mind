package com.example.virtualmind.feature.dashboard;

import android.content.Context;
import com.virtualmind.core.network.WellnessApi;
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
public final class WellnessViewModel_Factory implements Factory<WellnessViewModel> {
  private final Provider<WellnessApi> wellnessApiProvider;

  private final Provider<Context> contextProvider;

  public WellnessViewModel_Factory(Provider<WellnessApi> wellnessApiProvider,
      Provider<Context> contextProvider) {
    this.wellnessApiProvider = wellnessApiProvider;
    this.contextProvider = contextProvider;
  }

  @Override
  public WellnessViewModel get() {
    return newInstance(wellnessApiProvider.get(), contextProvider.get());
  }

  public static WellnessViewModel_Factory create(Provider<WellnessApi> wellnessApiProvider,
      Provider<Context> contextProvider) {
    return new WellnessViewModel_Factory(wellnessApiProvider, contextProvider);
  }

  public static WellnessViewModel newInstance(WellnessApi wellnessApi, Context context) {
    return new WellnessViewModel(wellnessApi, context);
  }
}
