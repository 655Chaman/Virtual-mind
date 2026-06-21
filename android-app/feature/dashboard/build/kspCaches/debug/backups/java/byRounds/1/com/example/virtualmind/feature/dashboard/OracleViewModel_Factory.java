package com.example.virtualmind.feature.dashboard;

import com.virtualmind.core.network.OracleApi;
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
public final class OracleViewModel_Factory implements Factory<OracleViewModel> {
  private final Provider<OracleApi> oracleApiProvider;

  public OracleViewModel_Factory(Provider<OracleApi> oracleApiProvider) {
    this.oracleApiProvider = oracleApiProvider;
  }

  @Override
  public OracleViewModel get() {
    return newInstance(oracleApiProvider.get());
  }

  public static OracleViewModel_Factory create(Provider<OracleApi> oracleApiProvider) {
    return new OracleViewModel_Factory(oracleApiProvider);
  }

  public static OracleViewModel newInstance(OracleApi oracleApi) {
    return new OracleViewModel(oracleApi);
  }
}
